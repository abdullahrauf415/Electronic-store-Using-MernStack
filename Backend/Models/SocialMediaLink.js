import mongoose from "mongoose";

const socialMediaLinkSchema = new mongoose.Schema({
  platform: { type: String, required: true, unique: true },
  url: { type: String, required: true },
  icon: { type: String }, // Optional icon field
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const SocialMediaLink = mongoose.model(
  "SocialMediaLink",
  socialMediaLinkSchema
);

export default SocialMediaLink;
