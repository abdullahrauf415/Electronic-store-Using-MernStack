import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OrderHistory.css";
import { FaCheckCircle, FaTruck, FaTimesCircle } from "react-icons/fa";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);

  // Fetch all orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token"); // Adjust this based on where you store your token

        const response = await axios.get(
          "http://localhost:3000/get-all-orders",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("Fetch orders response:", response.data);
        if (response.data.success) {
          setOrders(response.data.orders);
          setError(null);
        } else {
          setError("Failed to fetch orders: success flag false");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(
          "Error fetching orders: " +
            (err.response?.data?.message || err.message)
        );
      }
    };
    fetchOrders();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return <FaCheckCircle className="status-icon delivered" />;
      case "Shipped":
        return <FaTruck className="status-icon shipped" />;
      case "Cancelled":
        return <FaTimesCircle className="status-icon cancelled" />;
      default:
        return null;
    }
  };
  const handleStatusChange = async (orderId, userEmail, newStatus) => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:3000/update-order-status",
        {
          email: userEmail,
          orderId,
          newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.orderId === orderId ? { ...order, status: newStatus } : order
          )
        );
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="order-history-container">
      <h2 className="order-history-title">Order Management Dashboard</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="order-grid">
        {orders.length === 0 && !error && <p>No orders found.</p>}

        {orders.map((order, index) => (
          <div
            key={order._id || `${order.orderId}-${index}`}
            className="order-card"
          >
            <div className="order-header">
              <div className="order-meta">
                <div className="user-info">
                  <span className="user-name">{order.name}</span>
                  <span className="user-email">{order.email}</span>
                </div>
                <div className="order-status">
                  {getStatusIcon(order.status)}
                  <span className={`status-text ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="order-details">
                <div className="detail-group">
                  <span className="detail-label">Order ID:</span>
                  <span className="detail-value">{order.orderId}</span>
                </div>
                <div className="detail-group">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{formatDate(order.date)}</span>
                </div>
                <div className="detail-group">
                  <span className="detail-label">Total:</span>
                  <span className="detail-value">
                    {order.total !== undefined
                      ? `$${order.total.toFixed(2)}`
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            <div className="order-items">
              <h4>Items:</h4>
              {order.items && order.items.length > 0 ? (
                <ul>
                  {order.items.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p>No items found</p>
              )}
            </div>

            <div className="status-controls">
              <select
                value={order.status}
                onChange={(e) =>
                  handleStatusChange(order.orderId, order.email, e.target.value)
                }
              >
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
