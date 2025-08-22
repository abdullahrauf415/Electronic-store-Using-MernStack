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

// Enhanced FAQ matcher with keyword scoring
const getMatchingFAQs = (faqs, message) => {
  const lowerCaseMsg = message.toLowerCase();
  const words = lowerCaseMsg.split(/\s+/);
  const priorityKeywords = [
    "return",
    "refund",
    "exchange",
    "policy",
    "warranty",
    "delivery",
    "shipping",
  ];

  return faqs
    .map((faq) => {
      const q = faq.question.toLowerCase();
      let score = 0;

      // Boost score for priority keywords
      priorityKeywords.forEach((keyword) => {
        if (q.includes(keyword) && lowerCaseMsg.includes(keyword)) {
          score += 10;
        }
      });

      // Direct match scoring
      if (q.includes(lowerCaseMsg) || lowerCaseMsg.includes(q)) score += 8;

      // Word-based scoring
      words.forEach((word) => {
        if (q.includes(word)) score += 2;
      });

      return { ...faq.toObject(), score };
    })
    .filter((faq) => faq.score > 5)
    .sort((a, b) => b.score - a.score);
};

// Enhanced price extraction with "k" handling
const extractPriceRange = (message) => {
  // Handle "k" notation (e.g., "50k" = 50000)
  const normalizedMsg = message
    .toLowerCase()
    .replace(/(\d+)\s*k\b/gi, (match, num) => num * 1000)
    .replace(/(\d+)k\b/gi, (match, num) => num * 1000);

  const pricePatterns = [
    {
      regex: /(under|below|less than)\s*rs\.?\s*(\d+,\d+|\d+)/i,
      max: (match) => parseInt(match[2].replace(/,/g, ""), 10),
    },
    {
      regex: /(over|above|more than)\s*rs\.?\s*(\d+,\d+|\d+)/i,
      min: (match) => parseInt(match[2].replace(/,/g, ""), 10),
    },
    {
      regex: /between\s*rs\.?\s*(\d+,\d+|\d+)\s*and\s*rs\.?\s*(\d+,\d+|\d+)/i,
      min: (match) => parseInt(match[1].replace(/,/g, ""), 10),
      max: (match) => parseInt(match[2].replace(/,/g, ""), 10),
    },
    {
      regex: /rs\.?\s*(\d+,\d+|\d+)\s*to\s*rs\.?\s*(\d+,\d+|\d+)/i,
      min: (match) => parseInt(match[1].replace(/,/g, ""), 10),
      max: (match) => parseInt(match[2].replace(/,/g, ""), 10),
    },
    {
      regex: /rs\.?\s*(\d+,\d+|\d+)/i,
      exact: (match) => parseInt(match[1].replace(/,/g, ""), 10),
    },
  ];

  for (const pattern of pricePatterns) {
    const match = normalizedMsg.match(pattern.regex);
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

// Enhanced product name extraction
const extractProductNames = (message) => {
  const productKeywords = [
    // Phones
    "iphone",
    "samsung",
    "infinix",
    "xiaomi",
    "redmi",
    "oppo",
    "vivo",
    "realme",
    "tecno",
    "nokia",
    "oneplus",
    "google pixel",
    "motorola",
    "sony xperia",
    "huawei",
    "honor",

    // Laptops
    "dell",
    "hp",
    "lenovo",
    "asus",
    "acer",
    "apple macbook",
    "msi",
    "microsoft surface",

    // Other gadgets
    "headphone",
    "earbud",
    "smartwatch",
    "tablet",
    "camera",
    "drone",
    "playstation",
    "xbox",
    "console",
    "gaming",
    "watch",

    // Electronics
    "refrigerator",
    "fridge",
    "washing machine",
    "microwave",
    "oven",
    "television",
    "tv",
    "ac",
    "air conditioner",
    "fan",
    "heater",
    "blender",
    "toaster",
    "vacuum cleaner",
    "iron",
    "grill",
    "cooker",
    "kettle",
    "juicer",
    "mixer",
    "dishwasher",
    "dryer",
  ];

  const foundKeywords = productKeywords.filter((keyword) =>
    new RegExp(`\\b${keyword}\\b`, "i").test(message)
  );

  // Extract specific product models
  const modelPatterns = [
    /(infinix\s+(?:smart\s+)?\d+\s*\w*)/i,
    /(samsung\s+galaxy\s+\w+)/i,
    /(iphone\s+\d+\s*\w*)/i,
    /(redmi\s+note\s+\d+)/i,
    /(dell\s+inspiron\s+\w+)/i,
    /(hp\s+pavilion\s+\w*)/i,
    /(lenovo\s+ideapad\s+\w*)/i,
    /(asus\s+vivobook\s+\w*)/i,
  ];

  const modelMatches = modelPatterns
    .map((pattern) => {
      const match = message.match(pattern);
      return match ? match[1] : null;
    })
    .filter((match) => match !== null);

  return [...new Set([...foundKeywords, ...modelMatches])];
};

// Enhanced category detection
const detectCategory = (message) => {
  const lowerMsg = message.toLowerCase();

  // Electronics (household appliances)
  if (
    /(refrigerator|fridge|washing machine|microwave|oven|ac|air conditioner|fan|heater|blender|toaster|vacuum|iron|grill|cooker|kettle|juicer|mixer|dishwasher|dryer)/i.test(
      lowerMsg
    )
  ) {
    return "Electronics";
  }

  // Gadgets (phones, laptops, etc.)
  if (
    /(phone|smartphone|laptop|tablet|headphone|earbud|smartwatch|camera|drone|playstation|xbox|console|gaming|watch)/i.test(
      lowerMsg
    )
  ) {
    return "Gadgets";
  }

  // Accessories
  if (
    /(case|cover|charger|cable|adapter|stand|holder|protector|stylus|mount|dock|grip|strap|band)/i.test(
      lowerMsg
    )
  ) {
    return "Accessories";
  }

  return null;
};

// Enhanced chatbot route with comprehensive query handling
router.post("/chatbot", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const message = req.body.message.trim();
    const lowerCaseMsg = message.toLowerCase();
    let reply = "";

    // 1. Handle Greetings
    if (
      /(hi|hello|hey|good\s(morning|afternoon|evening))/i.test(lowerCaseMsg)
    ) {
      const greetings = [
        "Hello! Welcome to GadgetStore. How can I assist you today?",
        "Hi there! Ready to explore our electronics collection?",
        "Good day! How can I help with your gadget needs?",
      ];
      reply = greetings[Math.floor(Math.random() * greetings.length)];
    }

    // 2. Social Media Requests
    else if (
      /(facebook|instagram|twitter|tiktok|social media|link|connect|follow)/i.test(
        lowerCaseMsg
      )
    ) {
      const platformMatch = lowerCaseMsg.match(
        /(facebook|instagram|twitter|tiktok|whatsapp)/
      );
      const links = await SocialMediaLink.find({});

      if (platformMatch) {
        const platform = platformMatch[0];
        const link = links.find((l) =>
          l.platform.toLowerCase().includes(platform)
        );

        reply = link
          ? `Here's our ${platform} link: ${link.url}`
          : `We don't have an official ${platform} page yet. Check back soon!`;
      } else {
        reply =
          links.length > 0
            ? "Connect with us on:\n" +
              links.map((l) => `- ${l.platform}: ${l.url}`).join("\n")
            : "Our social links are coming soon!";
      }
    }

    // 3. Payment Method Requests
    else if (
      /(payment|pay|method|jazz cash|easypaisa|credit card|debit card|bank transfer|cash on delivery|cod|online payment|digital wallet|card|visa|mastercard)/i.test(
        lowerCaseMsg
      )
    ) {
      reply =
        "We accept the following payment methods:\n\n" +
        "• Cash on Delivery (COD)\n" +
        "• Credit/Debit Cards (Visa, MasterCard)\n\n" +
        "You can select your preferred payment method during checkout.";
    }

    // 4. Order Status & Tracking Requests
    else if (
      /(order|track|status|delivery|ship|where is my order|when will i receive)/i.test(
        lowerCaseMsg
      )
    ) {
      const orderIdMatch = message.match(/\bORD\d{4,}\b/i);

      if (orderIdMatch) {
        const orderId = orderIdMatch[0];
        const user = await Users.findById(userId);
        const order = user?.orders.find((o) => o.orderId === orderId);

        if (order) {
          reply = `Order ${orderId}:\n- Status: ${
            order.status
          }\n- Date: ${order.date.toDateString()}`;

          if (order.deliveryDetails) {
            reply += `\n- Delivery Address: ${order.deliveryDetails.address}`;
          }
        } else {
          reply = `Sorry, I couldn't find order ${orderId}. Please check your order ID and try again.`;
        }
      } else {
        reply =
          "Please provide your Order ID (format: ORD12345) so I can check your order status.";
      }
    }

    // 5. FAQ & Policy Requests
    else if (
      /(policy|return|refund|warranty|faq|how to|procedure|question|help)/i.test(
        lowerCaseMsg
      )
    ) {
      const faqs = await Faq.find({});
      const matchingFAQs = getMatchingFAQs(faqs, message);

      if (matchingFAQs.length > 0) {
        reply = matchingFAQs[0].answer;

        if (matchingFAQs.length > 1) {
          reply +=
            "\n\nRelated FAQs:\n" +
            matchingFAQs
              .slice(1, 4)
              .map((f, i) => `${i + 1}. ${f.question}`)
              .join("\n");
        }
      } else {
        reply =
          "For detailed information, please visit our website or contact our support team at support@gadgetstore.com";
      }
    }

    // 6. Store Information Requests
    else if (
      /(store|location|address|open|close|timing|hour|contact|phone|number|email)/i.test(
        lowerCaseMsg
      )
    ) {
      reply =
        " **GadgetStore Information:**\n\n" +
        " Address: 123 Gadget Street, Tech City, Pakistan\n" +
        " Opening Hours: 10:00 AM - 10:00 PM (Monday-Sunday)\n" +
        " Contact Number: +92 300 0000000\n" +
        " WhatsApp: +92 300 0000000\n" +
        " Email:mail: support@gadgetstore.com\n\n" +
        "Feel free to visit us or contact for any queries!";
    }

    // 7. Product Requests
    else if (
      /(product|item|show|find|recommend|suggest|buy|price|have|stock|do you have|looking for|want to buy)/i.test(
        lowerCaseMsg
      ) ||
      /(washing machine|fridge|phone|laptop|tv|television|headphone|earbud|tablet|camera|drone|refrigerator|microwave|oven|ac|air conditioner|fan|heater|blender|toaster|vacuum|iron)/i.test(
        lowerCaseMsg
      )
    ) {
      const priceRange = extractPriceRange(message);
      const productNames = extractProductNames(message);
      const category = detectCategory(message);

      // Build query
      const query = { available: true };

      // Add category filter if detected
      if (category) {
        query.category = category;
      }

      // Add product name filter if specified
      if (productNames.length > 0) {
        query.$or = [
          ...productNames.map((name) => ({ name: new RegExp(name, "i") })),
          ...productNames.map((name) => ({
            description: new RegExp(name, "i"),
          })),
        ];
      }

      // Add price filter if specified
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

      // If no specific query, show popular items in relevant category
      if (Object.keys(query).length === 1 && !category) {
        query.category = { $in: ["Electronics", "Gadgets", "Accessories"] };
      }

      // Find products
      const products = await Product.find(query).limit(5);

      if (products.length > 0) {
        reply =
          "Here are some options that match your request:\n\n" +
          products
            .map((p, i) => {
              const minPrice = Math.min(...p.size.map((s) => s.new_price));
              const maxPrice = Math.max(...p.size.map((s) => s.new_price));
              const priceRange =
                minPrice === maxPrice
                  ? `Rs. ${minPrice}`
                  : `Rs. ${minPrice} - Rs. ${maxPrice}`;

              return `${i + 1}. ${p.name} - ${priceRange}`;
            })
            .join("\n\n");

        reply += `\n\nView details: ${
          process.env.STORE_BASE_URL || "http://localhost:5173"
        }/products`;
      } else {
        reply = "I couldn't find products matching your request.";

        // Provide helpful suggestions
        if (productNames.length > 0) {
          reply = `Sorry, we don't have ${productNames.join(
            " or "
          )} in stock right now.`;
        }

        if (priceRange) {
          const priceText =
            priceRange.min && priceRange.max
              ? `between Rs. ${priceRange.min} and Rs. ${priceRange.max}`
              : priceRange.min
              ? `above Rs. ${priceRange.min}`
              : `under Rs. ${priceRange.max}`;

          reply += ` We don't have ${
            category || "products"
          } ${priceText} at the moment.`;
        }

        // Suggest alternatives
        const alternatives = await Product.find({
          available: true,
          category: category || {
            $in: ["Electronics", "Gadgets", "Accessories"],
          },
        }).limit(3);

        if (alternatives.length > 0) {
          reply +=
            "\n\nYou might be interested in:\n" +
            alternatives
              .map((p, i) => {
                const minPrice = Math.min(...p.size.map((s) => s.new_price));
                return `${i + 1}. ${p.name} - Rs. ${minPrice}`;
              })
              .join("\n");
        }
      }
    }

    // 8. Fallback to Gemini for other queries
    else {
      reply = await askGemini(
        `You are GadgetBot, an assistant for GadgetStore Pakistan. Respond concisely to store-related queries.
        User: ${message}`
      );

      if (!reply || reply.trim() === "") {
        reply =
          "I'm still learning about that. Ask me about products, policies, orders, or store information!";
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

    res.json({ success: true, reply });
  } catch (err) {
    console.error("Chatbot Error:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Chat history routes
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
