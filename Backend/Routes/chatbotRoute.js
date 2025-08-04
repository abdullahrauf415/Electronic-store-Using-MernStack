// Routes/chatbotRoute.js
import express from "express";
import mongoose from "mongoose";
import { askGemini } from "../Utils/geminiChat.js";
import ChatMessage from "../Models/ChatMessage.js";
import Product from "../Models/product.js";
import SocialMediaLink from "../Models/SocialMediaLink.js";
import Users from "../Models/user.js";
import Faq from "../Models/faq.js";
import verifyToken from "../Middleware/authMiddleware.js";

const router = express.Router();

// Enhanced FAQ matcher with return policy priority
const getMatchingFAQs = (faqs, message) => {
  const lowerCaseMsg = message.toLowerCase();
  const words = lowerCaseMsg.split(/\s+/);

  // Priority keywords for returns
  const returnKeywords = ["return", "refund", "exchange", "policy"];
  const isReturnQuery = returnKeywords.some((kw) => lowerCaseMsg.includes(kw));

  return faqs
    .map((faq) => {
      const q = faq.question.toLowerCase();
      let score = 0;

      // Boost score for return-related FAQs
      if (isReturnQuery && returnKeywords.some((kw) => q.includes(kw))) {
        score += 15; // High priority boost
      }

      // Direct match scoring
      if (q.includes(lowerCaseMsg) || lowerCaseMsg.includes(q)) score += 10;

      // Individual word matching
      words.forEach((word) => {
        if (q.includes(word)) score += 3;
      });

      return { ...faq.toObject(), score };
    })
    .filter((faq) => faq.score > 5)
    .sort((a, b) => b.score - a.score);
};

// ====================== UPDATED CHATBOT ROUTE ======================== //
router.post("/chatbot", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const message = req.body.message.trim();
    const lowerCaseMsg = message.toLowerCase();
    let reply = "";

    // Get recent context (last 5 messages)
    const recentChats = await ChatMessage.find({ userId })
      .sort({ timestamp: -1 })
      .limit(5);

    const context = recentChats
      .reverse()
      .map((chat) => `User: ${chat.message}\nBot: ${chat.reply}`)
      .join("\n");

    // Base prompt for Gemini
    const basePrompt = `You are a helpful assistant for an electronics store in Pakistan. Keep responses concise (1-2 sentences max). 
Chat history:
${context}
User: ${message}`;

    // 1. Handle Greetings
    if (/(hi|hello|hey|good\s(morning|afternoon|evening))/i.test(message)) {
      reply = "Hello! How can I assist you with electronic products today?";
    }

    // 2. Social Media Requests
    else if (
      /(link|social media|facebook|instagram|twitter|tiktok|connect|follow)/i.test(
        message
      )
    ) {
      const socialLinks = await SocialMediaLink.find({});

      if (socialLinks.length > 0) {
        reply =
          "Connect with us on:\n" +
          socialLinks
            .map((link) => `- ${link.platform}: ${link.url}`)
            .join("\n");
      } else {
        reply = "Visit our store: https://electronix.com";
      }
    }

    // 3. Order Status Requests
    else if (/(order|track|status|delivery|ship)/i.test(message)) {
      const orderIdMatch = message.match(/\bORD\d{4,}\b/i);

      if (orderIdMatch) {
        const orderId = orderIdMatch[0];
        const user = await Users.findById(userId);
        const order = user?.orders.find((o) => o.orderId === orderId);

        if (order) {
          reply = `Order ${orderId}:\n- Status: ${
            order.status
          }\n- Last update: ${order.lastUpdate.toDateString()}`;
        } else {
          reply = `Order ${orderId} not found. Please verify your order ID.`;
        }
      } else {
        reply =
          "Please provide your Order ID (format: ORD12345) to check status.";
      }
    }

    // 4. FAQ & Policy Requests - PRIORITIZED ABOVE PRODUCT QUERIES
    else if (
      /(policy|return|refund|warranty|faq|exchange|how to|procedure)/i.test(
        message
      )
    ) {
      const allFAQs = await Faq.find({});

      if (allFAQs.length === 0) {
        reply =
          "For return assistance, please contact support@example.com or call +92-XXX-XXXXXXX.";
      } else {
        const matchingFAQs = getMatchingFAQs(allFAQs, message);

        if (matchingFAQs.length > 0) {
          reply = matchingFAQs[0].answer;

          // Add related FAQs
          if (matchingFAQs.length > 1) {
            reply +=
              "\n\nRelated questions:\n" +
              matchingFAQs
                .slice(1, 3)
                .map((f, i) => `${i + 1}. ${f.question}`)
                .join("\n");
          }
        } else {
          reply =
            "Our standard return policy:\n" +
            "- 14-day return window\n" +
            "- Unopened items only\n" +
            "- Proof of purchase required\n\n" +
            "For specific cases, contact support@example.com";
        }
      }
    }

    // 5. Product Information Requests - UPDATED WITH HOUSEHOLD APPLIANCES
    else if (
      /(product|item|device|model|specs|about|details|recommend|appliance|gadget|electronics|household)/i.test(
        message
      )
    ) {
      // Extract product names using keyword matching
      const productKeywords = [
        "laptop",
        "phone",
        "tv",
        "headphone",
        "camera",
        "watch",
        "tablet",
        "monitor",
        "router",
        "speaker",
        "earbuds",
        // Household appliances
        "refrigerator",
        "fridge",
        "washing machine",
        "microwave",
        "oven",
        "blender",
        "toaster",
        "vacuum cleaner",
        "air conditioner",
        "fan",
        "heater",
        "iron",
        "water purifier",
        "juicer",
        "mixer",
        "dishwasher",
        "dryer",
        "cooker",
        "kettle",
        "grill",
      ];

      const matchedKeywords = productKeywords.filter((kw) =>
        new RegExp(`\\b${kw}s?\\b`, "i").test(message)
      );

      if (matchedKeywords.length > 0) {
        // Find matching products
        const products = await Product.find({
          $or: matchedKeywords.map((kw) => ({ name: new RegExp(kw, "i") })),
        }).limit(3);

        if (products.length > 0) {
          // Format product details with links
          reply =
            "Here are some options:\n" +
            products
              .map((p, i) => {
                const availability = p.available
                  ? "✅ In stock"
                  : "❌ Currently out of stock";
                const minPrice = Math.min(...p.size.map((s) => s.new_price));
                // Generate product link - using slug or ID
                const productLink = `${process.env.STORE_BASE_URL}/products/${
                  p.slug || p._id
                }`;
                return `${i + 1}. ${
                  p.name
                } - Rs ${minPrice} (${availability})\n   View: ${productLink}`;
              })
              .join("\n\n");

          reply += "\n\nAsk about a specific product for more details!";
        } else {
          reply = `I couldn't find any ${matchedKeywords.join(
            "/"
          )} products. Would you like me to check something else?`;
        }
      } else {
        reply = "Could you please specify which product you're interested in?";
      }
    }

    // 6. Fallback to Gemini for other queries
    else {
      reply = await askGemini(basePrompt);

      // Ensure Gemini response is appropriate
      if (!reply || reply.trim() === "") {
        reply =
          "I'm still learning about that. Could you rephrase or ask about our products/policies?";
      } else if (reply.length > 300) {
        reply = reply.slice(0, 300) + "...";
      }
    }

    // Save to chat history
    const chat = new ChatMessage({
      userId,
      message,
      reply,
      timestamp: new Date(),
    });
    await chat.save();

    res.json({ success: true, reply, messageId: chat._id });
  } catch (err) {
    console.error("Chatbot Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ======== EXISTING ROUTES ======== //
router.get("/chat-history", verifyToken, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user._id }).sort({
      timestamp: 1,
    });
    res.json(messages);
  } catch {
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
});

router.delete("/chat-messages/:id", verifyToken, async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.id);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (message.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await ChatMessage.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete message" });
  }
});

router.delete("/chat-messages", verifyToken, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user._id });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to clear chat history" });
  }
});

export default router;
