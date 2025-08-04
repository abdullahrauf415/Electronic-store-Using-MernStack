import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  userName: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  date: { type: Date, default: Date.now },
});

const Review = mongoose.model("Review", reviewSchema);

export default Review;
