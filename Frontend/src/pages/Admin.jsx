import React from "react";
import "./CSS/Admin.css";
import Sidebar from "../Components/Sidebar/Sidebar";
import { Routes, Route, Link } from "react-router-dom";
import AddProduct from "../Components/AddProduct/AddProduct";
import ListProduct from "../Components/ListProduct/ListProduct";
import OrderHistory from "../Components/OrderHistory/OrderHistory";

const Admin = () => {
  return (
    <div className="Admin">
      <Sidebar />
      <div className="AdminContent">
        <Routes>
          <Route index element={<WelcomeMessage />} />
          <Route path="AddProduct" element={<AddProduct />} />
          <Route path="ListProduct" element={<ListProduct />} />
          <Route path="OrderHistory" element={<OrderHistory />} />
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
      </div>
    </div>
  );
};

export default Admin;
