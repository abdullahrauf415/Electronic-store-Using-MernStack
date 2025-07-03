import PDFDocument from "pdfkit";
import fs from "fs";
import Faq from "../Models/faq.js";

export const generateFaqPDF = async (outputPath = "output/faq.pdf") => {
  const faqs = await Faq.find();
  const doc = new PDFDocument();
  fs.mkdirSync("output", { recursive: true });
  doc.pipe(fs.createWriteStream(outputPath));

  doc.fontSize(18).text("Frequently Asked Questions", { underline: true });
  doc.moveDown();

  faqs.forEach((faq, index) => {
    doc
      .fontSize(14)
      .fillColor("black")
      .text(`Q${index + 1}: ${faq.question}`);
    doc.fontSize(12).fillColor("gray").text(`A: ${faq.answer}`).moveDown();
  });

  doc.end();
  console.log("✅ FAQ PDF generated.");
};

// This function generates a PDF document containing FAQs from the database.
