import express from "express";
import Faq from "../Models/faq.js";
import { generateFaqPDF } from "../Utils/generateFaqPDF.js";

const router = express.Router();

// Get all FAQs
router.get("/faqs", async (req, res) => {
  try {
    const faqs = await Faq.find({});
    res.json({ success: true, faqs });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch FAQs" });
  }
});

// Add FAQ
router.post("/add-faq", async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({
      success: false,
      message: "Both question and answer are required",
    });
  }

  try {
    const newFaq = new Faq({ question, answer });
    await newFaq.save();

    await generateFaqPDF();

    res.json({ success: true, message: "FAQ added successfully", faq: newFaq });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add FAQ" });
  }
});

// Update FAQ
router.put("/update-faq/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Both question and answer are required",
      });
    }

    const updatedFaq = await Faq.findByIdAndUpdate(
      id,
      { question, answer },
      { new: true }
    );

    if (!updatedFaq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    await generateFaqPDF(); // ✅ regenerate PDF

    res.json({
      success: true,
      message: "FAQ updated successfully",
      faq: updatedFaq,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update FAQ" });
  }
});

// Delete FAQ
router.delete("/delete-faq/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFaq = await Faq.findByIdAndDelete(id);

    if (!deletedFaq) {
      return res.status(404).json({ success: false, message: "FAQ not found" });
    }

    await generateFaqPDF();

    res.json({ success: true, message: "FAQ deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete FAQ" });
  }
});

export default router;
