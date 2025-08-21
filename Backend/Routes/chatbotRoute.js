import express from "express";
import { askGemini } from "../Utils/geminiChat.js";
import ChatMessage from "../Models/ChatMessage.js";
import Product from "../Models/product.js";
import SocialMediaLink from "../Models/SocialMediaLink.js";
import Users from "../Models/user.js";
import Faq from "../Models/faq.js";
import verifyToken from "../Middleware/authMiddleware.js";

const router = express.Router();

// Simple FAQ matcher
const getMatchingFAQs = (faqs, message) => {
  const lowerCaseMsg = message.toLowerCase();
  return faqs.filter((faq) => {
    const question = faq.question.toLowerCase();
    return question
      .split(/\s+/)
      .some((word) => word.length > 3 && lowerCaseMsg.includes(word));
  });
};

// Improved price extraction that handles "k" for thousands
const extractPrice = (message) => {
  // Handle "50k", "30k" etc.
  const kMatch = message.match(/(\d+)\s*k/i);
  if (kMatch) {
    return parseInt(kMatch[1]) * 1000;
  }

  // Handle regular numbers
  const priceMatch = message.match(/(\d+,\d+|\d+)/);
  return priceMatch ? parseInt(priceMatch[0].replace(/,/g, "")) : null;
};

// Improved product query extraction
const extractProductQuery = (message) => {
  const lowerCaseMsg = message.toLowerCase();

  // Remove common question phrases and price references
  const cleanedMessage = lowerCaseMsg
    .replace(
      /(do you have|can you show|i want|show me|looking for|find|give me|any|some|suggest|recommend)/gi,
      ""
    )
    .replace(/(under|over|below|above)\s*(rs\.?)?\s*(\d+)(k| thousand)?/gi, "")
    .replace(/"|'/g, "")
    .trim();

  return cleanedMessage;
};

// Main chatbot route
router.post("/chatbot", verifyToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const message = req.body.message.trim();
    const lowerCaseMsg = message.toLowerCase();
    let reply = "";

    console.log("User asked:", message);

    // 1. Handle COMMON STORE QUERIES FIRST
    if (
      /(what do you offer|what are you offering|what products|what do you sell|what do you have)/i.test(
        lowerCaseMsg
      )
    ) {
      // Get some sample products from each category
      const electronics = await Product.findOne({
        category: /electronics/i,
        available: true,
      });
      const gadgets = await Product.findOne({
        category: /gadgets/i,
        available: true,
      });
      const accessories = await Product.findOne({
        category: /accessories/i,
        available: true,
      });

      reply = "We offer a wide range of electronics products including:\n\n";

      if (electronics)
        reply += `🏠 Electronics: ${electronics.name} - Rs. ${Math.min(
          ...electronics.size.map((s) => s.new_price)
        )}\n`;
      if (gadgets)
        reply += `📱 Gadgets: ${gadgets.name} - Rs. ${Math.min(
          ...gadgets.size.map((s) => s.new_price)
        )}\n`;
      if (accessories)
        reply += `🎧 Accessories: ${accessories.name} - Rs. ${Math.min(
          ...accessories.size.map((s) => s.new_price)
        )}\n`;

      reply += "\nYou can browse our complete catalog on our website!";
    }

    // 2. Handle FAQs
    else {
      const allFAQs = await Faq.find({});
      const matchingFAQs = getMatchingFAQs(allFAQs, lowerCaseMsg);

      if (matchingFAQs.length > 0) {
        reply = matchingFAQs[0].answer;
        console.log("Answered from FAQ");
      }

      // 3. IMPROVED SOCIAL MEDIA REQUESTS
      else if (
        /(facebook|instagram|twitter|whatsapp|social media|link)/i.test(
          lowerCaseMsg
        )
      ) {
        const socialLinks = await SocialMediaLink.find({});

        if (socialLinks.length > 0) {
          // Check for specific platform requests
          if (lowerCaseMsg.includes("facebook")) {
            const fbLink = socialLinks.find((link) =>
              link.platform.toLowerCase().includes("facebook")
            );
            reply = fbLink
              ? `Our Facebook: ${fbLink.url}`
              : "Sorry, we don't have a Facebook page yet. Here are our other social links:\n" +
                socialLinks
                  .map((link) => `- ${link.platform}: ${link.url}`)
                  .join("\n");
          } else if (lowerCaseMsg.includes("instagram")) {
            const instaLink = socialLinks.find((link) =>
              link.platform.toLowerCase().includes("instagram")
            );
            reply = instaLink
              ? `Our Instagram: ${instaLink.url}`
              : "Sorry, we don't have an Instagram page yet. Here are our other social links:\n" +
                socialLinks
                  .map((link) => `- ${link.platform}: ${link.url}`)
                  .join("\n");
          } else if (lowerCaseMsg.includes("twitter")) {
            const twitterLink = socialLinks.find((link) =>
              link.platform.toLowerCase().includes("twitter")
            );
            reply = twitterLink
              ? `Our Twitter: ${twitterLink.url}`
              : "Sorry, we don't have a Twitter account yet. Here are our other social links:\n" +
                socialLinks
                  .map((link) => `- ${link.platform}: ${link.url}`)
                  .join("\n");
          } else {
            // General social media request
            reply =
              "Our social media links:\n" +
              socialLinks
                .map((link) => `- ${link.platform}: ${link.url}`)
                .join("\n");
          }
        } else {
          reply =
            "We're not on social media yet. Please visit our website for updates.";
        }
      }

      // 4. IMPROVED PRODUCT SEARCH
      else {
        // Extract product query from message
        const productQuery = extractProductQuery(message);
        const price = extractPrice(message);

        console.log("Searching for:", productQuery, "Price limit:", price);

        if (!productQuery || productQuery.length < 2) {
          reply =
            "Please specify what product you're looking for. For example: 'phones', 'laptops', 'chargers'";
        } else {
          // Search for products in database
          let query = {
            available: true,
            $or: [
              { name: new RegExp(productQuery, "i") },
              { description: new RegExp(productQuery, "i") },
              { category: new RegExp(productQuery, "i") },
            ],
          };

          // Add price filter if specified
          if (price) {
            query["size.new_price"] = { $lte: price };
          }

          const products = await Product.find(query).limit(5);

          if (products.length > 0) {
            reply = `I found these products${
              price ? ` under Rs. ${price}` : ""
            }:\n\n`;
            products.forEach((product, index) => {
              const minPrice = Math.min(
                ...product.size.map((s) => s.new_price)
              );
              const maxPrice = Math.max(
                ...product.size.map((s) => s.new_price)
              );
              const priceRange =
                minPrice === maxPrice
                  ? `Rs. ${minPrice}`
                  : `Rs. ${minPrice} - Rs. ${maxPrice}`;

              reply += `${index + 1}. ${product.name}\n`;
              reply += `   Price: ${priceRange}\n`;
              reply += `   Category: ${product.category}\n\n`;
            });

            reply += "You can find these products on our website!";
          } else {
            // If no products found, search in the relevant category
            let categoryQuery = { available: true };

            // Determine category based on product query
            if (
              /(phone|mobile|smartphone|redmi|samsung|iphone)/i.test(
                productQuery
              )
            ) {
              categoryQuery.category = /gadgets/i;
            } else if (/(laptop|computer|macbook)/i.test(productQuery)) {
              categoryQuery.category = /gadgets/i;
            } else if (
              /(fridge|refrigerator|microwave|oven|washing|machine)/i.test(
                productQuery
              )
            ) {
              categoryQuery.category = /electronics/i;
            } else if (
              /(charger|cable|case|cover|headphone|earphone)/i.test(
                productQuery
              )
            ) {
              categoryQuery.category = /accessories/i;
            }

            // Add price filter if specified
            if (price) {
              categoryQuery["size.new_price"] = { $lte: price };
            }

            const categoryProducts = await Product.find(categoryQuery).limit(3);

            if (categoryProducts.length > 0) {
              reply = `I couldn't find "${productQuery}"${
                price ? ` under Rs. ${price}` : ""
              }.\n\n`;
              reply += "But we have these similar products available:\n\n";
              categoryProducts.forEach((product, index) => {
                const minPrice = Math.min(
                  ...product.size.map((s) => s.new_price)
                );
                reply += `${index + 1}. ${product.name} - Rs. ${minPrice}\n`;
              });
            } else {
              // Final fallback - show any available products
              const anyProducts = await Product.find({ available: true }).limit(
                3
              );

              if (anyProducts.length > 0) {
                reply = `Sorry, no ${productQuery} found${
                  price ? ` under Rs. ${price}` : ""
                }.\n\n`;
                reply += "Here are some of our available products:\n\n";
                anyProducts.forEach((product, index) => {
                  const minPrice = Math.min(
                    ...product.size.map((s) => s.new_price)
                  );
                  reply += `${index + 1}. ${product.name} - Rs. ${minPrice}\n`;
                });
              } else {
                reply = `Sorry, no products found${
                  price ? ` under Rs. ${price}` : ""
                }.`;
                reply += "\nPlease check our website for our complete catalog.";
              }
            }
          }
        }
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
    res.status(500).json({
      success: false,
      message: "Sorry, I'm having trouble right now. Please try again later.",
    });
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
