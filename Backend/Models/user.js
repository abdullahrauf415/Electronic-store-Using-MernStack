import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  cartData: Object,
  isAdmin: { type: Boolean, default: false },
  orders: [
    {
      orderId: String,
      items: [String],
      total: Number,
      date: { type: Date, default: Date.now },
      status: { type: String, default: "Pending" },
    },
  ],
  date: { type: Date, default: Date.now },
});

const Users = mongoose.model("Users", userSchema);

export default Users;
