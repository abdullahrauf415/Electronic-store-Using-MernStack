import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  image: [String],
  category: String,
  size: [
    {
      size: String,
      new_price: Number,
      old_price: Number,
    },
  ],
  color: [String],
  date: { type: Date, default: Date.now },
  available: { type: Boolean, default: true },
});

const Product = mongoose.model("Product", productSchema);
export default Product;
