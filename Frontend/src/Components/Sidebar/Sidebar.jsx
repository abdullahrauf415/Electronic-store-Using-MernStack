import React from "react";
import "./Sidebar.css";
import { Link } from "react-router-dom";
import { FaPlus, FaList, FaHistory } from "react-icons/fa";

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
          <FaPlus className="sidebar-icon" />
          <p>Manage FAQs</p>
        </div>
      </Link>
    </div>
  );
};

export default Sidebar;
