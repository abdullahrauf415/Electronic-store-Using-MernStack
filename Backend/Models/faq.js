import mongoose from "mongoose";
const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
});
export default mongoose.model("Faq", faqSchema);
// This code defines a Mongoose schema for FAQs, which includes fields for the question and answer.
// It then exports a Mongoose model named 'Faq' based on this schema, allowing for CRUD operations on FAQ documents in a MongoDB database.
