import mongoose from "mongoose";

const quickLinkSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  icon: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const QuickLink = mongoose.model("QuickLink", quickLinkSchema);

export default QuickLink;
