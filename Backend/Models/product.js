import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  description: String,
});
export default mongoose.model("Product", productSchema);
// This code defines a Mongoose schema for products, which includes fields for the product name, price, and description.
