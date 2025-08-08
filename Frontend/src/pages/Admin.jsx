import React from "react";
import "./CSS/Admin.css";
import {
  Routes,
  Route,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import AddProduct from "../Components/AddProduct/AddProduct";
import ListProduct from "../Components/ListProduct/ListProduct";
import OrderHistory from "../Components/OrderHistory/OrderHistory";
import FaqManager from "../Components/FaqManager/FaqManager";
import AdminSocialMedia from "../Components/AdminSocialMedia/AdminSocialMedia";
import AdminQuickLinks from "../Components/AdminQuickLinks/AdminQuickLinks";

const Admin = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isWelcomePage =
    location.pathname.endsWith("/admin") ||
    location.pathname.endsWith("/admin/");

  return (
    <div className="Admin">
      <div className="AdminContent">
        {!isWelcomePage && (
          <button
            className="admin-back-button"
            onClick={() => navigate("/admin")}
          >
            ← Back to Dashboard
          </button>
        )}

        <Routes>
          <Route index element={<WelcomeMessage />} />
          <Route path="AddProduct" element={<AddProduct />} />
          <Route path="ListProduct" element={<ListProduct />} />
          <Route path="OrderHistory" element={<OrderHistory />} />
          <Route path="FaqManager" element={<FaqManager />} />
          <Route path="AdminSocialMedia" element={<AdminSocialMedia />} />
          <Route path="AdminQuickLinks" element={<AdminQuickLinks />} />
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </div>
    </div>
  );
};

const WelcomeMessage = () => {
  return (
    <div className="admin-welcome">
      <h1>Welcome to GadgetStore Admin Panel</h1>
      <p className="subtitle">AI-Assisted Electronics Management</p>

      <div className="admin-quick-access">
        <div className="access-card">
          <h2>Add New Product</h2>
          <p>Create new product entries with detailed specifications</p>
          <Link to="AddProduct" className="access-button">
            Go to Add Product →
          </Link>
        </div>

        <div className="access-card">
          <h2>Manage Products</h2>
          <p>View and modify existing products in your inventory</p>
          <Link to="ListProduct" className="access-button">
            Go to Product List →
          </Link>
        </div>

        <div className="access-card">
          <h2>Order History</h2>
          <p>Review all customer orders and transaction details</p>
          <Link to="OrderHistory" className="access-button">
            View Order History →
          </Link>
        </div>

        <div className="access-card">
          <h2>FAQ Manager</h2>
          <p>Manage frequently asked questions and answers</p>
          <Link to="FaqManager" className="access-button">
            Go to FAQ Manager →
          </Link>
        </div>
        <div className="access-card">
          <h2>Social Media Links</h2>
          <p>Manage your social media presence and links</p>
          <Link to="AdminSocialMedia" className="access-button">
            Go to Social Media Manager →
          </Link>
        </div>
        <div className="access-card">
          <h2>Quick Links</h2>
          <p>Manage Quick links</p>
          <Link to="AdminQuickLinks" className="access-button">
            Go to Quick Links
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Admin;
