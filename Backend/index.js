const port = 3000;
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jsonwebtoken = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Middleware
app.use(express.json());
app.use(cors());

// Ensure upload directory exists
const uploadDir = "./upload/images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// MongoDB connection
mongoose
  .connect("mongodb://localhost:27017/electronic-store")
  .then(async () => {
    console.log("Connected to MongoDB");
    await createAdminUser();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

// JWT Admin Middleware
const verifyAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });

    const decoded = jsonwebtoken.verify(token, "secret_ecom");
    const user = await Users.findById(decoded.user.id);

    if (!user || !user.isAdmin) {
      return res
        .status(403)
        .json({ success: false, message: "Admin access required" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

// Test route
app.get("/", (req, res) => {
  res.send("API is working");
});

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    ),
});
const upload = multer({ storage });

// Serve images
app.use("/images", express.static(path.join(__dirname, "upload/images")));

// Image upload route
app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: true,
    image_url: `http://localhost:${port}/images/${req.file.filename}`,
  });
});

// Product schema
const Product = mongoose.model("Product", {
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

// Add product - admin only
app.post("/add-product", verifyAdmin, async (req, res) => {
  try {
    if (!Array.isArray(req.body.size) || req.body.size.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one size with pricing is required",
      });
    }

    for (const size of req.body.size) {
      if (!size.size || !size.new_price || !size.old_price) {
        return res.status(400).json({
          success: false,
          message: "Each size must have size, new_price, and old_price",
        });
      }
    }

    const products = await Product.find({});
    const id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const product = new Product({
      id,
      name: req.body.name,
      description: req.body.description,
      image: Array.isArray(req.body.image) ? req.body.image : [],
      category: req.body.category,
      size: req.body.size,
      color: Array.isArray(req.body.color) ? req.body.color : [],
    });

    await product.save();
    res.status(200).json({
      success: true,
      message: "Product added successfully",
      name: product.name,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to save product" });
  }
});

// Delete product (optional: protect with verifyAdmin)
app.post("/removeproduct", verifyAdmin, async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({ success: true, name: req.body.name });
});

// Get all products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  res.send(products);
});

// Update product protect with verifyAdmin
app.post("/updateproduct", verifyAdmin, async (req, res) => {
  try {
    const { id, name, description, image, category, size, color } = req.body;

    if (size && (!Array.isArray(size) || size.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "At least one size with pricing is required",
      });
    }

    const updated = await Product.findOneAndUpdate(
      { id },
      {
        $set: {
          name,
          description,
          image: Array.isArray(image) ? image : [],
          category,
          size: Array.isArray(size) ? size : [],
          color: Array.isArray(color) ? color : [],
        },
      },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updated,
    });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update product" });
  }
});
// Toggle product availability - admin only
app.put("/toggle-availability/:id", verifyAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const product = await Product.findOne({ id: productId });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Toggle availability
    product.available = !product.available;
    await product.save();

    res.json({
      success: true,
      message: "Product availability updated",
      available: product.available,
    });
  } catch (err) {
    console.error("Toggle availability error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// User schema
const Users = mongoose.model("Users", {
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

// Create admin
async function createAdminUser() {
  try {
    const existingAdmin = await Users.findOne({
      email: "abdullahrauf415@gmail.com",
    });
    if (existingAdmin) return console.log("✅ Admin already exists");

    const hashedPassword = await bcrypt.hash("admin123", 10);
    const cart = {};
    for (let i = 0; i < 300; i++) cart[i] = 0;

    const adminUser = new Users({
      name: "Admin",
      email: "abdullahrauf415@gmail.com",
      password: hashedPassword,
      cartData: cart,
      isAdmin: true,
    });

    await adminUser.save();
    console.log(" Admin user created: admin@gmail.com / admin123");
  } catch (err) {
    console.error(" Failed to create admin user:", err);
  }
}

// Signup
app.post("/signup", async (req, res) => {
  let check = await Users.findOne({ email: req.body.email });
  if (check) {
    return res
      .status(400)
      .json({ success: false, errors: "Existing user found with same email" });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const cart = {};
  for (let index = 0; index < 300; index++) cart[index] = 0;

  const user = new Users({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    cartData: cart,
    isAdmin: false,
  });

  await user.save();

  const data = { user: { id: user.id, name: user.name } };
  const token = jsonwebtoken.sign(data, "secret_ecom", { expiresIn: "1h" });
  res.json({ success: true, token });
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await Users.findOne({ email });

  if (!user)
    return res.status(400).json({ success: false, message: "User not found" });

  const isMatch = bcrypt.compare(password, user.password);
  if (!isMatch)
    return res
      .status(400)
      .json({ success: false, message: "Incorrect password" });

  const data = { user: { id: user.id, name: user.name } };
  const token = jsonwebtoken.sign(data, "secret_ecom", { expiresIn: "1h" });
  res.json({
    success: true,
    token,
    email: user.email,
    isAdmin: user.isAdmin,
  });
});
// Verify token
app.get("/verify-token", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });

    const decoded = jsonwebtoken.verify(token, "secret_ecom");
    const user = await Users.findById(decoded.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "Token is valid",
      email: user.email,
      isAdmin: user.isAdmin,
    });
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
});
// Get products by category
app.get("/products-by-category", async (req, res) => {
  try {
    const { category, page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find({ category }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments({ category }),
    ]);

    res.json({ success: true, products, total });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }
});

// Place order
app.post("/place-order", async (req, res) => {
  try {
    const {
      email,
      items,
      total,
      paymentMethod,
      transactionId,
      address,
      phone,
      name,
    } = req.body;

    const user = await Users.findOne({ email });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const newOrder = {
      orderId: `ORD${Date.now()}`,
      items: items.map((item) => item.name), // use items from req.body
      total,
      status: "Pending",
      date: new Date(),
      payment: {
        method: paymentMethod,
        transactionId,
      },
      deliveryDetails: {
        name,
        phone,
        address,
      },
    };

    user.orders.push(newOrder);
    await user.save();

    res.json({ success: true, message: "Order placed", order: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to place order" });
  }
});

app.get("/user-orders/:email", async (req, res) => {
  const email = req.params.email;
  const user = await Users.findOne({ email });

  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  res.json({ success: true, orders: user.orders });
});

// Get all orders - admin only
app.get("/get-all-orders", verifyAdmin, async (req, res) => {
  try {
    const users = await Users.find({}, "email name orders").lean(); // .lean() returns plain JS objects
    const allOrders = [];

    users.forEach((user) => {
      user.orders.forEach((order) => {
        allOrders.push({ email: user.email, name: user.name, ...order });
      });
    });

    allOrders.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, orders: allOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// Update order status
app.post("/update-order-status", verifyAdmin, async (req, res) => {
  try {
    const { email, orderId, newStatus } = req.body;
    const user = await Users.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    const order = user.orders.find((o) => o.orderId === orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    order.status = newStatus;
    await user.save();

    res.json({ success: true, message: "Order status updated", order });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to update order status" });
  }
});

// Get cart
app.get("/get-cart", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jsonwebtoken.verify(token, "secret_ecom");
    const user = await Users.findById(decoded.user.id);
    res.json({ success: true, cartData: user.cartData });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch cart" });
  }
});

// Update cart
app.post("/update-cart", async (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const decoded = jsonwebtoken.verify(token, "secret_ecom");
    const user = await Users.findByIdAndUpdate(
      decoded.user.id,
      { cartData: req.body.cartData },
      { new: true }
    );
    res.json({ success: true, cartData: user.cartData });
  } catch {
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
});

// My orders
app.get("/my-orders", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const token = req.headers.authorization.split(" ")[1];
    const decoded = jsonwebtoken.verify(token, "secret_ecom");
    const user = await Users.findById(decoded.user.id);

    const totalPages = Math.ceil(user.orders.length / limit);
    const orders = user.orders.slice(skip, skip + limit);

    res.json({ success: true, orders, totalPages, currentPage: page });
  } catch {
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
});

// New arrivals
app.get("/newArrivels", async (req, res) => {
  let products = await Product.find({});
  let newArrivels = products.slice(1).slice(-8);
  res.send(newArrivels);
});

// Popular items
app.get("/popularitems", async (req, res) => {
  let product = await Product.find({});
  let popularitems = product.slice(0, 4);
  res.send(popularitems);
});

// Review schema
const Review = mongoose.model("Review", {
  productId: Number,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  userName: String,
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
  date: { type: Date, default: Date.now },
});
// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const decoded = jsonwebtoken.verify(token, "secret_ecom");
    const user = await Users.findById(decoded.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

// Submit a review
app.post("/submit-review", verifyToken, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const user = req.user;

    // Validate input
    if (!productId || !rating || !comment) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const parsedProductId = parseInt(productId, 10);
    if (isNaN(parsedProductId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Rating must be between 1-5" });
    }

    // Check if product exists
    const product = await Product.findOne({ id: parsedProductId });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    const review = new Review({
      productId: parsedProductId,
      userId: user._id,
      userName: user.name,
      rating,
      comment,
    });

    await review.save();
    res
      .status(201)
      .json({ success: true, message: "Review submitted", review });
  } catch (err) {
    console.error("Submit review error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to submit review" });
  }
});

// Get product reviews
app.get("/product-reviews/:productId", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId, 10);
    if (isNaN(productId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product ID" });
    }

    const reviews = await Review.find({ productId }).sort({ date: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    console.error("Fetch reviews error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch reviews" });
  }
});
// GET Product Reviews
app.get("/product-reviews/:productId", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    if (isNaN(productId))
      return res.status(400).json({ error: "Invalid product ID" });

    const reviews = await Review.find({ productId }).sort({ date: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// POST Submit Review
app.post("/submit-review", verifyToken, async (req, res) => {
  try {
    const { productId, comment, rating } = req.body;
    const user = req.user;

    if (!productId || !comment || !rating) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const review = new Review({
      productId,
      userId: user._id,
      userName: user.name,
      rating,
      comment,
    });

    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// Start server
app.listen(port, (error) => {
  if (!error) {
    console.log(`Server is running on http://localhost:${port}`);
  } else {
    console.error("Error in server setup:", error);
  }
});
