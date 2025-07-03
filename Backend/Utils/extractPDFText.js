import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const PDFParser = require("pdf2json");

export const extractFAQTextFromPDF = (pdfPath) => {
  return new Promise((resolve) => {
    try {
      if (!fs.existsSync(pdfPath)) {
        console.error(`PDF file not found: ${pdfPath}`);
        return resolve("No FAQ data available. Please contact support.");
      }

      const pdfParser = new PDFParser();
      let text = "";

      pdfParser.on("pdfParser_dataError", (errData) => {
        console.error("PDF parsing error:", errData);
        resolve("Error parsing PDF. Please try again later.");
      });

      pdfParser.on("pdfParser_dataReady", () => {
        try {
          text = pdfParser.getRawTextContent();
          resolve(text || "No text content found in PDF.");
        } catch (err) {
          console.error("Text extraction error:", err);
          resolve("Error extracting text from PDF.");
        }
      });

      pdfParser.loadPDF(pdfPath);
    } catch (err) {
      console.error("PDF extraction failed:", err);
      resolve("System error processing PDF.");
    }
  });
};
