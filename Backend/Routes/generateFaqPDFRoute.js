import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Faq from "../Models/faq.js";
import { setFaqCacheDirty } from "../cache/faqCache.js"; // <-- create this (see below)

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

function generateFaqPDFStream(faqs, writeStream) {
  const doc = new PDFDocument({ autoFirstPage: true, margin: 50 });
  doc.pipe(writeStream);

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

  doc.end();
}

// GET /api/generate-faq-pdf?download=1
router.get("/generate-faq-pdf", async (req, res) => {
  try {
    const faqs = await Faq.find({}).sort({ createdAt: -1 }).limit(100); // raise if needed
    if (!faqs.length) {
      return res
        .status(404)
        .json({ success: false, message: "No FAQs found in the database." });
    }

    // Ensure output dir
    const outputPath = path.join(__dirname, "../output/faq.pdf");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    // Write to disk
    const diskStream = fs.createWriteStream(outputPath);
    generateFaqPDFStream(faqs, diskStream);

    // Also return to caller
    if (req.query.download === "1") {
      // Wait until disk write completes before streaming back
      diskStream.on("finish", () => {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", 'attachment; filename="faq.pdf"');
        fs.createReadStream(outputPath).pipe(res);
      });
    } else {
      // JSON success (faster API use)
      diskStream.on("finish", () => {
        setFaqCacheDirty(); // tell chatbot to reload PDF on next query
        res.json({
          success: true,
          message: "FAQ PDF regenerated.",
          count: faqs.length,
        });
      });
    }
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).json({ success: false, message: "Error generating PDF" });
  }
});

export default router;
