import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import jsonwebtoken from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Users from "./Models/user.js";
import Review from "./Models/review.js";
import SocialMediaLink from "./Models/SocialMediaLink.js";
import QuickLink from "./Models/quickLink.js";
import "./Models/product.js";
import Product from "./Models/product.js";
import generateFaqPDFRoute from "./Routes/generateFaqPDFRoute.js";
import faqRoute from "./Routes/faqRoute.js";
import dotenv from "dotenv";
import chatbotRoute from "./Routes/chatbotRoute.js";

//load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middleware
app.use(express.json());
app.use(cors(
  {
    origin:["htpps://deploy-mern-1whq.vercel.app"],
    methods:["POST","GET"],
    credentlias:true 
  }
));

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || "./upload/images";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
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

    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
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

// Delete product
app.post("/removeproduct", verifyAdmin, async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({ success: true, name: req.body.name });
});

// Get all products
app.get("/allproducts", async (req, res) => {
  let products = await Product.find({});
  res.send(products);
});

// Update product
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

// Toggle product availability
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

// Create admin
async function createAdminUser() {
  try {
    const existingAdmin = await Users.findOne({
      email: process.env.ADMIN_EMAIL,
    });
    if (existingAdmin) return console.log("✅ Admin already exists");

    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    const cart = {};
    for (let i = 0; i < 300; i++) cart[i] = 0;

    const adminUser = new Users({
      name: "Admin",
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      cartData: cart,
      isAdmin: true,
    });

    await adminUser.save();
    console.log(`Admin user created: ${process.env.ADMIN_EMAIL}`);
  } catch (err) {
    console.error("Failed to create admin user:", err);
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

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch)
    return res
      .status(400)
      .json({ success: false, message: "Incorrect password" });

  const data = { user: { id: user.id, name: user.name } };
  // Use JWT_SECRET from env
  const token = jsonwebtoken.sign(data, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
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

    // Use JWT_SECRET from env
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    const user = await Users.findById(decoded.user.id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: "Token is valid",
      email: user.email,
      name: user.name,
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
      items: items.map((item) => item.name),
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
    const users = await Users.find({}, "email name orders").lean();
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
app.delete("/admin/delete-order", verifyAdmin, async (req, res) => {
  try {
    const { email, orderId } = req.body;

    // Validate input
    if (!email || !orderId) {
      return res.status(400).json({
        success: false,
        message: "Email and order ID are required",
      });
    }

    // Find user and update orders
    const user = await Users.findOneAndUpdate(
      { email },
      { $pull: { orders: { orderId } } },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if order was actually removed
    const orderExists = user.orders.some((order) => order.orderId === orderId);
    if (orderExists) {
      return res.status(404).json({
        success: false,
        message: "Order not found in user's orders",
      });
    }

    res.json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (err) {
    console.error("Admin delete order error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
    });
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

// Verify Token Middleware
const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    // Use JWT_SECRET from env
    const decoded = jsonwebtoken.verify(token, process.env.JWT_SECRET);
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
// Remove an order for the logged-in user
app.delete("/remove-order/:orderId", verifyToken, async (req, res) => {
  try {
    const { orderId } = req.params;
    const user = req.user;

    const orderIndex = user.orders.findIndex((o) => o.orderId === orderId);

    if (orderIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    // Prevent deletion of Shipped/Delivered orders
    if (["Shipped", "Delivered"].includes(user.orders[orderIndex].status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot remove shipped or delivered orders",
      });
    }

    user.orders.splice(orderIndex, 1);
    await user.save();

    res.json({ success: true, message: "Order removed successfully" });
  } catch (err) {
    console.error("Remove order error:", err);
    res.status(500).json({ success: false, message: "Failed to remove order" });
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
// Delete a review
app.delete("/delete-review/:reviewId", verifyToken, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const user = req.user;

    const review = await Review.findById(reviewId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // Check if the review belongs to the logged-in user
    if (review.userId.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this review",
      });
    }

    await Review.findByIdAndDelete(reviewId);

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (err) {
    console.error("Delete review error:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete review" });
  }
});
// Get all social media links
app.get("/social-media-links", async (req, res) => {
  try {
    const links = await SocialMediaLink.find({});
    res.json({ success: true, links });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch social media links",
    });
  }
});
// Add new social media link - Admin only
app.post("/social-media-links", verifyAdmin, async (req, res) => {
  try {
    const { platform, url, icon } = req.body;

    if (!platform || !url) {
      return res.status(400).json({
        success: false,
        message: "Platform and URL are required",
      });
    }

    // Check if platform already exists
    const existingLink = await SocialMediaLink.findOne({ platform });
    if (existingLink) {
      return res.status(409).json({
        success: false,
        message: "Platform already exists. Use update instead.",
      });
    }

    const newLink = new SocialMediaLink({
      platform,
      url,
      icon: icon || "",
    });

    await newLink.save();

    res.status(201).json({
      success: true,
      message: "Social media link added",
      link: newLink,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to add social media link",
    });
  }
});
// Update social media link - Admin only
app.put("/social-media-links/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, icon } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: "URL is required",
      });
    }

    const updatedLink = await SocialMediaLink.findByIdAndUpdate(
      id,
      {
        url,
        icon: icon || "",
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedLink) {
      return res.status(404).json({
        success: false,
        message: "Social media link not found",
      });
    }

    res.json({
      success: true,
      message: "Social media link updated",
      link: updatedLink,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update social media link",
    });
  }
});

// Delete social media link - Admin only
app.delete("/social-media-links/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedLink = await SocialMediaLink.findByIdAndDelete(id);

    if (!deletedLink) {
      return res.status(404).json({
        success: false,
        message: "Social media link not found",
      });
    }

    res.json({
      success: true,
      message: "Social media link deleted",
      link: deletedLink,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete social media link",
    });
  }
});

// Get all quick links
app.get("/quick-links", async (req, res) => {
  try {
    const links = await QuickLink.find({}).sort({ createdAt: -1 });
    res.json({ success: true, links });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch quick links",
    });
  }
});

// Add new quick link - Admin only
app.post("/quick-links", verifyAdmin, async (req, res) => {
  try {
    const { title, content, icon } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const newLink = new QuickLink({
      title,
      content,
      icon: icon || "",
    });

    await newLink.save();

    res.status(201).json({
      success: true,
      message: "Quick link added",
      link: newLink,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to add quick link",
    });
  }
});

// Update quick link - Admin only
app.put("/quick-links/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, icon } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const updatedLink = await QuickLink.findByIdAndUpdate(
      id,
      {
        title,
        content,
        icon: icon || "",
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedLink) {
      return res.status(404).json({
        success: false,
        message: "Quick link not found",
      });
    }

    res.json({
      success: true,
      message: "Quick link updated",
      link: updatedLink,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update quick link",
    });
  }
});

// Delete quick link - Admin only
app.delete("/quick-links/:id", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedLink = await QuickLink.findByIdAndDelete(id);

    if (!deletedLink) {
      return res.status(404).json({
        success: false,
        message: "Quick link not found",
      });
    }

    res.json({
      success: true,
      message: "Quick link deleted",
      link: deletedLink,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete quick link",
    });
  }
});
// Use the routes
app.use("/api", generateFaqPDFRoute);
app.use("/api", faqRoute);
app.use("/api", chatbotRoute);

// Start server
app.listen(port, (error) => {
  if (!error) {
    console.log(`Server is running on http://localhost:${port}`);
  } else {
    console.error("Error in server setup:", error);
  }
});
