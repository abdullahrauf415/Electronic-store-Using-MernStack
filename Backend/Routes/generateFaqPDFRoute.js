import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Faq from "../Models/faq.js"; // <-- Make sure this path is correct

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Function to generate text-extractable PDF
const generateFaqPDF = (faqs) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      doc.registerFont("Helvetica", "Helvetica");
      doc.font("Helvetica");

      doc.fontSize(18).text("Frequently Asked Questions", { align: "center" });
      doc.moveDown();

      faqs.forEach((faq, index) => {
        doc
          .fontSize(14)
          .fillColor("black")
          .text(`Q${index + 1}: ${faq.question}`);
        doc.fontSize(12).fillColor("gray").text(`A: ${faq.answer}`).moveDown();
      });

      const buffers = [];
      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// GET /api/generate-faq-pdf
router.get("/generate-faq-pdf", async (req, res) => {
  try {
    const faqs = await Faq.find().limit(20); // Load up to 20 FAQs from MongoDB

    if (!faqs.length) {
      return res.status(404).send("No FAQs found in the database.");
    }

    const pdfBuffer = await generateFaqPDF(faqs);
    const outputPath = path.join(__dirname, "../output/faq.pdf");
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, pdfBuffer);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=faqs.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Error generating PDF");
  }
});

export default router;
