import express from "express";
import PDFDocument from "pdfkit";
import Faq from "../Models/faq.js";
import { setFaqCacheDirty } from "../cache/faqCache.js";

const router = express.Router();

// Stream PDF directly to response
function generateFaqPDFStream(faqs, res) {
  const doc = new PDFDocument({ autoFirstPage: true, margin: 50 });

  // Set headers to force download
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", 'attachment; filename="faq.pdf"');

  // Pipe PDF directly to response
  doc.pipe(res);

  // Content
  doc
    .font("Helvetica")
    .fontSize(18)
    .text("Frequently Asked Questions", { align: "center" });

  doc.moveDown();

  faqs.forEach((faq, i) => {
    doc
      .font("Helvetica-Bold")
      .fontSize(14)
      .fillColor("black")
      .text(`Q${i + 1}: ${faq.question}`);
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("gray")
      .text(`A: ${faq.answer}`, { paragraphGap: 12 });
    doc.moveDown();
  });

  doc.end(); // Finalize PDF stream
}

// GET /api/generate-faq-pdf
router.get("/generate-faq-pdf", async (req, res) => {
  try {
    const faqs = await Faq.find({}).sort({ createdAt: -1 }).limit(100);

    if (!faqs.length) {
      return res.status(404).json({
        success: false,
        message: "No FAQs found in the database.",
      });
    }

    // Set optional dirty flag
    setFaqCacheDirty?.();

    // Generate and send the PDF
    generateFaqPDFStream(faqs, res);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
    });
  }
});

export default router;
