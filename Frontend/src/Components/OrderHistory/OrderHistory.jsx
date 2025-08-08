import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "./OrderHistory.css";
import { FaCheckCircle, FaTruck, FaTimesCircle, FaTrash } from "react-icons/fa";
import { MdCancel, MdDeleteForever } from "react-icons/md";
import HomeContext from "../../Context/HomeContext";

const OrderHistory = () => {
  const {
    user,
    isAdmin,
    logout,
    loading: contextLoading,
  } = useContext(HomeContext);

  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    order: null,
  });
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const isLoading = contextLoading || localLoading;

  // Fetch all orders
  useEffect(() => {
    if (contextLoading || !user?.token) return;

    const fetchOrders = async () => {
      try {
        setLocalLoading(true);
        const response = await axios.get(
          "http://localhost:3000/get-all-orders",
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

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

        if (err.response?.status === 401) {
          logout();
        }
      } finally {
        setLocalLoading(false);
      }
    };

    fetchOrders();
  }, [user, contextLoading, logout]);

  // Filter orders based on status and search term
  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case "Delivered":
        return <FaCheckCircle className="status-icon delivered" />;
      case "Shipped":
        return <FaTruck className="status-icon shipped" />;
      case "Cancelled":
        return <FaTimesCircle className="status-icon cancelled" />;
      default:
        return <span className="status-icon pending">⏱️</span>;
    }
  };

  const handleStatusChange = async (orderId, userEmail, newStatus) => {
    try {
      const response = await axios.post(
        "http://localhost:3000/update-order-status",
        {
          email: userEmail,
          orderId,
          newStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
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

      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const confirmDelete = (order) => {
    setDeleteModal({
      open: true,
      order: {
        id: order.orderId,
        email: order.email,
        name: order.name,
      },
    });
  };

  const handleDeleteOrder = async () => {
    const { id, email } = deleteModal.order;

    try {
      await axios.delete("http://localhost:3000/admin/delete-order", {
        data: { email, orderId: id },
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setOrders((prev) => prev.filter((order) => order.orderId !== id));
      setDeleteModal({ open: false, order: null });
    } catch (error) {
      console.error("Delete failed:", error);
      alert(
        `Delete failed: RS.{error.response?.data?.message || error.message}`
      );

      if (error.response?.status === 401) {
        logout();
      }
    }
  };

  const formatDate = (dateString) => {
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (isLoading) {
    return (
      <div className="order-history-container">
        <h2 className="order-history-title">Order Management Dashboard</h2>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="order-history-container">
        <h2 className="order-history-title">Order Management Dashboard</h2>
        <div className="admin-restricted">
          <FaTimesCircle className="restricted-icon" />
          <p>Admin privileges required to view this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      <h2 className="order-history-title">Order Management Dashboard</h2>

      {error && <p className="error-message">{error}</p>}

      {/* Filters Section */}
      <div className="filters-container">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="status-filter">
          <label>Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="Pending">Pending</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Order Stats */}
      <div className="order-stats">
        <div className="stat-card total">
          <span className="stat-value">{orders.length}</span>
          <span className="stat-label">Total Orders</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-value">
            {orders.filter((o) => o.status === "Pending").length}
          </span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card shipped">
          <span className="stat-value">
            {orders.filter((o) => o.status === "Shipped").length}
          </span>
          <span className="stat-label">Shipped</span>
        </div>
        <div className="stat-card delivered">
          <span className="stat-value">
            {orders.filter((o) => o.status === "Delivered").length}
          </span>
          <span className="stat-label">Delivered</span>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="order-grid">
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <p>No orders found matching your criteria</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.orderId}
              className={`order-card RS.{order.status.toLowerCase()}`}
            >
              <div className="order-header">
                <div className="order-id">
                  <span>ORDER #</span>
                  <strong>{order.orderId}</strong>
                </div>

                <div className="order-status">
                  {getStatusIcon(order.status)}
                  <span
                    className={`status-text RS.{order.status.toLowerCase()}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="order-body">
                <div className="user-info">
                  <div className="user-name">
                    <span>Customer:</span>
                    <strong>{order.name}</strong>
                  </div>
                  <div className="user-email">
                    <span>Email:</span>
                    <a href={`mailto:RS.{order.email}`}>{order.email}</a>
                  </div>
                </div>

                <div className="order-details">
                  <div className="order-date">
                    <span>Order Date:</span>
                    <strong>{formatDate(order.date)}</strong>
                  </div>
                  <div className="order-total">
                    <span>Total:</span>
                    <strong>RS.{order.total?.toFixed(2) || "0.00"}</strong>
                  </div>
                </div>
              </div>

              <div className="order-items">
                <div className="items-label">
                  Items ({order.items?.length || 0}):
                </div>
                <ul>
                  {order.items?.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="order-footer">
                <div className="status-controls">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(
                        order.orderId,
                        order.email,
                        e.target.value
                      )
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <button
                  className="delete-btn"
                  onClick={() => confirmDelete(order)}
                  aria-label={`Delete order RS.{order.orderId}`}
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.open && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <div className="modal-header">
              <h3>Confirm Order Deletion</h3>
            </div>

            <div className="modal-content">
              <MdDeleteForever className="delete-icon" />
              <p>
                Are you sure you want to permanently delete order{" "}
                <strong>{deleteModal.order.id}</strong> for customer{" "}
                <strong>{deleteModal.order.name}</strong>?
              </p>
              <p className="warning-text">
                This action cannot be undone and will permanently remove the
                order record.
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setDeleteModal({ open: false, order: null })}
              >
                <MdCancel /> Cancel
              </button>
              <button
                className="confirm-delete-btn"
                onClick={handleDeleteOrder}
              >
                <FaTrash /> Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
