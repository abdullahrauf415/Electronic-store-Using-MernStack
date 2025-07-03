import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { extractFAQTextFromPDF } from "../Utils/extractPDFText.js";
import path from "path";
import { fileURLToPath } from "url";
import ChatMessage from "../Models/ChatMessage.js";
// import { verifyToken } from "../Middleware/verifyToken.js"; // Optional: protect route with user auth

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const router = express.Router();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Test route to check if Gemini is working
router.get("/test-gemini", async (req, res) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello world");
    const text = await result.response.text();
    res.json({ success: true, response: text });
  } catch (err) {
    console.error("Gemini Test Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      stack: err.stack,
    });
  }
});

console.log(
  "Gemini API Key:",
  process.env.GEMINI_API_KEY ? "Exists" : "MISSING"
);

let cachedContextData = null;

router.post("/chat", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({
        response: "Query is required and must be a non-empty string.",
      });
    }

    // Load or reuse context data
    if (!cachedContextData) {
      try {
        const pdfPath = path.join(__dirname, "../output/faq.pdf");
        cachedContextData = await extractFAQTextFromPDF(pdfPath);
      } catch (err) {
        console.error("PDF extraction failed:", err);
        cachedContextData = "No FAQ data available.";
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
You are a helpful assistant for an electronics store.
Use only this FAQ data to answer questions:
${cachedContextData}
If the question can't be answered with this data, say:
"I can only answer questions about our store policies and products from our FAQ."

User Question: ${query}
    `;

    const result = await model.generateContent(prompt);
    const botReply = await result.response.text();

    // Save chat message (optional)
    if (req.user?._id) {
      await ChatMessage.create({
        userId: req.user._id,
        message: query,
        response: botReply,
      });
    }

    res.json({
      response: botReply || "No reply from Gemini.",
    });
  } catch (err) {
    console.error("Gemini chat error:", err);

    let errorMessage = "Gemini server error. Please try again later.";

    if (err.message.includes("API_KEY_INVALID")) {
      errorMessage = "Invalid Gemini API key.";
    } else if (err.message.includes("QUOTA_EXCEEDED")) {
      errorMessage = "API quota exceeded.";
    } else if (err.message.includes("MODEL_NOT_FOUND")) {
      errorMessage = "AI model not found.";
    }

    res.status(500).json({ response: errorMessage });
  }
});

export default router;
