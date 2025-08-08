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

// Map categories to keywords
const CATEGORY_KEYWORDS = {
  electronics: [
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
  ],
  gadgets: [
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
    "smartphone",
    "computer",
  ],
  accessories: [
    "case",
    "cover",
    "charger",
    "cable",
    "adapter",
    "stand",
    "holder",
    "protector",
    "stylus",
    "mount",
    "dock",
    "grip",
    "strap",
    "band",
  ],
};

// Extract price range from message
const extractPriceRange = (message) => {
  const pricePatterns = [
    {
      regex: /(under|below|less than)\s*rs\.?\s*(\d+)/i,
      max: (match) => parseFloat(match[2]),
    },
    {
      regex: /(over|above|more than)\s*rs\.?\s*(\d+)/i,
      min: (match) => parseFloat(match[2]),
    },
    {
      regex: /between\s*rs\.?\s*(\d+)\s*and\s*rs\.?\s*(\d+)/i,
      min: (match) => parseFloat(match[1]),
      max: (match) => parseFloat(match[2]),
    },
    {
      regex: /rs\.?\s*(\d+)\s*to\s*rs\.?\s*(\d+)/i,
      min: (match) => parseFloat(match[1]),
      max: (match) => parseFloat(match[2]),
    },
    { regex: /rs\.?\s*(\d+)/i, exact: (match) => parseFloat(match[1]) },
  ];

  for (const pattern of pricePatterns) {
    const match = message.match(pattern.regex);
    if (match) {
      if (pattern.exact) {
        const value = pattern.exact(match);
        return { min: value, max: value };
      }
      const range = {};
      if (pattern.min) range.min = pattern.min(match);
      if (pattern.max) range.max = pattern.max(match);
      return range;
    }
  }
  return null;
};

// Extract product names from message
const extractProductNames = (message) => {
  const productKeywords = [
    ...CATEGORY_KEYWORDS.electronics,
    ...CATEGORY_KEYWORDS.gadgets,
    ...CATEGORY_KEYWORDS.accessories,
  ];

  const foundKeywords = productKeywords.filter((keyword) =>
    new RegExp(`\\b${keyword}s?\\b`, "i").test(message)
  );

  // Extract custom product names using pattern matching
  const productPattern =
    /(?:show|find|look for|search for|about|buy)\s+(.*?)(?:\s+under|\s+between|\s+over|$)/i;
  const match = message.match(productPattern);
  const customNames = match && match[1] ? [match[1].trim()] : [];

  return [...new Set([...foundKeywords, ...customNames])];
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
    const basePrompt = `You are GadgetBot, a helpful assistant for GadgetStore in Pakistan. Keep responses concise (1-2 sentences max). 
Chat history:
${context}
User: ${message}`;

    // 1. Handle Greetings - Improved greeting responses
    if (
      /(hi|hello|hey|good\s(morning|afternoon|evening))/i.test(lowerCaseMsg)
    ) {
      const greetings = [
        "Hello! Welcome to GadgetStore. How can I assist you today?",
        "Hi there! How can I help with your electronics needs?",
        "Good day! What can I help you find today?",
        "Welcome to GadgetStore! How may I assist you?",
      ];
      reply = greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 2. Social Media Requests
    else if (
      /(link|social media|facebook|instagram|twitter|tiktok|connect|follow)/i.test(
        lowerCaseMsg
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
        reply = "Visit our store: https://gadgetstore.com";
      }
    }

    // 3. Order Status Requests - Improved order handling
    else if (/(order|track|status|delivery|ship)/i.test(lowerCaseMsg)) {
      const orderIdMatch = message.match(/\bORD\d{4,}\b/i);

      if (orderIdMatch) {
        const orderId = orderIdMatch[0];
        const user = await Users.findById(userId);
        const order = user?.orders.find((o) => o.orderId === orderId);

        if (order) {
          reply = `Order ${orderId}:\n- Status: ${
            order.status
          }\n- Last update: ${order.lastUpdate.toDateString()}`;
          if (order.status === "Shipped") {
            reply += `\n- Tracking number: ${
              order.trackingNumber || "Not available yet"
            }`;
          }
          if (order.status === "Delivered") {
            reply += `\n- Delivered on: ${
              order.deliveryDate?.toDateString() ||
              order.lastUpdate.toDateString()
            }`;
          }
        } else {
          reply = `Sorry, I couldn't find order ${orderId}. Please check your order ID and try again.`;
        }
      } else {
        reply =
          "Please provide your Order ID (format: ORD12345) so I can check your order status.";
      }
    }

    // 4. FAQ & Policy Requests
    else if (
      /(policy|return|refund|warranty|faq|exchange|how to|procedure)/i.test(
        lowerCaseMsg
      )
    ) {
      const allFAQs = await Faq.find({});

      if (allFAQs.length === 0) {
        reply =
          "For assistance, please contact support@gadgetstore.com or call +92-XXX-XXXXXXX.";
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
            "For specific cases, contact support@gadgetstore.com";
        }
      }
    }

    // 5. Product Information Requests - COMPLETELY REVISED
    else if (
      /(product|item|device|model|specs|about|details|recommend|appliance|gadget|electronics|household|price|cost|buy|purchase|available|stock)/i.test(
        lowerCaseMsg
      )
    ) {
      // Extract price range if mentioned
      const priceRange = extractPriceRange(lowerCaseMsg);

      // Extract product names/keywords
      const productNames = extractProductNames(lowerCaseMsg);

      // Determine category based on keywords
      let category = null;
      for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (
          keywords.some((kw) =>
            new RegExp(`\\b${kw}s?\\b`, "i").test(lowerCaseMsg)
          )
        ) {
          category = cat;
          break;
        }
      }

      // Build product query
      const query = { available: true };

      // Add category filter if identified
      if (category) {
        query.category = new RegExp(category, "i");
      }

      // Add name search if products mentioned
      if (productNames.length > 0) {
        query.$or = productNames.map((name) => ({
          name: new RegExp(name, "i"),
        }));
      }

      // Add price filter if range specified
      if (priceRange) {
        if (priceRange.min && priceRange.max) {
          query["size.new_price"] = {
            $gte: priceRange.min,
            $lte: priceRange.max,
          };
        } else if (priceRange.min) {
          query["size.new_price"] = { $gte: priceRange.min };
        } else if (priceRange.max) {
          query["size.new_price"] = { $lte: priceRange.max };
        }
      }

      // If no specific query, use a default
      if (Object.keys(query).length === 1) {
        // Only available:true
        query.category = { $in: ["Electronics", "Gadgets", "Accessories"] };
      }

      // Find matching products
      let products = await Product.find(query).limit(5);

      if (products.length > 0) {
        // Format product details with links
        reply =
          "Here are some options that match your request:\n" +
          products
            .map((p, i) => {
              const availability = p.available
                ? "✅ In stock"
                : "❌ Out of stock";
              const minPrice = Math.min(...p.size.map((s) => s.new_price));
              const maxPrice = Math.max(...p.size.map((s) => s.new_price));
              const priceRange =
                minPrice === maxPrice
                  ? `Rs ${minPrice}`
                  : `Rs ${minPrice} - Rs ${maxPrice}`;

              const productLink = `${process.env.STORE_BASE_URL}/products/${
                p.slug || p._id
              }`;
              return `${i + 1}. ${
                p.name
              } - ${priceRange} (${availability})\n   View: ${productLink}`;
            })
            .join("\n\n");

        if (products.length === 5) {
          reply +=
            "\n\nThere are more options available. Would you like to refine your search?";
        }
      } else {
        reply = "I couldn't find products matching your request.";

        // Provide suggestions based on what was missing
        if (productNames.length > 0 && category) {
          reply = `Sorry, we don't have ${productNames.join(
            " or "
          )} in ${category} right now.`;
        } else if (productNames.length > 0) {
          reply = `Sorry, we don't have ${productNames.join(
            " or "
          )} in stock at the moment.`;
        } else if (category) {
          reply = `Sorry, we don't have products in ${category} matching your criteria.`;
        }

        // Add alternative suggestions
        reply += "\n\nMaybe you'd be interested in these popular items:";
        const popularProducts = await Product.find({ available: true })
          .sort({ sold: -1 })
          .limit(3);

        if (popularProducts.length > 0) {
          reply +=
            "\n" +
            popularProducts
              .map((p, i) => {
                const minPrice = Math.min(...p.size.map((s) => s.new_price));
                return `${i + 1}. ${p.name} - Rs ${minPrice}`;
              })
              .join("\n");
        }
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
