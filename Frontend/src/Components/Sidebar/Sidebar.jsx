import React from "react";
import "./Sidebar.css";
import { Link } from "react-router-dom";
import {
  FaPlus,
  FaList,
  FaHistory,
  FaQuestionCircle,
  FaShareAlt,
  FaLink,
} from "react-icons/fa";

const Sidebar = () => {
  return (
    <div className="sidebar">
      <Link to="/Admin/AddProduct" style={{ textDecoration: "none" }}>
        <div className="sidebar-item">
          <FaPlus className="sidebar-icon" />
          <p>Add Product</p>
        </div>
      </Link>

      <Link to="/Admin/ListProduct" style={{ textDecoration: "none" }}>
        <div className="sidebar-item">
          <FaList className="sidebar-icon" />
          <p>Product List</p>
        </div>
      </Link>

      <Link to="/Admin/OrderHistory" style={{ textDecoration: "none" }}>
        <div className="sidebar-item">
          <FaHistory className="sidebar-icon" />
          <p>Order History</p>
        </div>
      </Link>

      <Link to="/Admin/FaqManager" style={{ textDecoration: "none" }}>
        <div className="sidebar-item">
          <FaQuestionCircle className="sidebar-icon" />
          <p>Manage FAQs</p>
        </div>
      </Link>

      <Link to="/Admin/AdminSocialMedia" style={{ textDecoration: "none" }}>
        <div className="sidebar-item">
          <FaShareAlt className="sidebar-icon" />
          <p>Add Social Media Links</p>
        </div>
      </Link>

      <Link to="/Admin/AdminQuickLinks" style={{ textDecoration: "none" }}>
        <div className="sidebar-item">
          <FaLink className="sidebar-icon" />
          <p>Add Quick Links</p>
        </div>
      </Link>
    </div>
  );
};

export default Sidebar;
