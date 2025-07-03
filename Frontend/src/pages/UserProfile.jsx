import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import HomeContext from "../Context/HomeContext";
import "./CSS/UserProfile.css";
import remove_icon from "../Components/Assets/cart_cross_icon.png";

const UserProfile = () => {
  const { user, cartItems, products, removeFromCart } = useContext(HomeContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.token) {
      setError("Please login to view your profile.");
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get(
          `http://localhost:3000/user-orders/${user.email}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );

        if (response.data.success) {
          const sortedOrders = (response.data.orders || []).sort(
            (a, b) => new Date(b.date || 0) - new Date(a.date || 0)
          );
          setOrders(sortedOrders);
        } else {
          setError(response.data.message || "Failed to load orders.");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError(
          err.response?.data?.message || err.message || "Error loading orders."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="user-profile-container">
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile-container error-state">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  const removeOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to remove this order?")) return;

    try {
      const response = await axios.delete(
        `http://localhost:3000/remove-order/${orderId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (response.data.success) {
        setOrders(orders.filter((order) => order.orderId !== orderId));
      } else {
        alert(response.data.message || "Failed to remove order");
      }
    } catch (err) {
      console.error("Order removal error:", err);
      alert(err.response?.data?.message || "Error removing order");
    }
  };

  return (
    <div className="user-profile-container">
      <h1>Your Profile</h1>

      <section className="profile-section">
        <h2>Account Information</h2>
        <div className="user-info">
          <p>
            <strong>Email:</strong> {user?.email || "N/A"}
          </p>
        </div>
      </section>

      <section className="profile-section">
        <h2>
          Current Cart (
          {Object.values(cartItems).filter((item) => item.quantity > 0).length}{" "}
          items)
        </h2>

        <div className="cart-items">
          <div className="cartitem-format-main">
            <p>Product</p>
            <p>Title</p>
            <p>Variant</p>
            <p>Price</p>
            <p>Quantity</p>
            <p>Total</p>
            <p>Remove</p>
          </div>
          <hr />

          {Object.keys(cartItems).length === 0 ? (
            <p className="cart-empty-message">Your cart is empty</p>
          ) : (
            Object.entries(cartItems).map(([key, cartItem]) => {
              const product = products.find((p) => p.id === cartItem.id);
              if (!product) return null;
              const uniqueKey = `${cartItem.id}-${cartItem.size}-${cartItem.color}`;
              return (
                <React.Fragment key={uniqueKey}>
                  <div className="cartitem-format">
                    <div className="cartitem-field">
                      <Link to={`/product/${product.id}`} className="item-link">
                        <img
                          src={
                            Array.isArray(product.image)
                              ? product.image[0]
                              : product.image
                          }
                          alt={product.name}
                          className="carticon-product-icon"
                        />
                      </Link>
                    </div>
                    <div className="cartitem-field">
                      <span className="value">{product.name}</span>
                    </div>
                    <div className="cartitem-field">
                      <span className="value variant">
                        {cartItem.size && (
                          <span className="variant-badge size">
                            {cartItem.size}
                          </span>
                        )}
                        {cartItem.color && (
                          <span className="variant-badge color">
                            {cartItem.color}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="cartitem-field">
                      <span className="value">Rs.{cartItem.price}</span>
                    </div>
                    <div className="cartitem-field">
                      <span className="value">
                        <button className="cartitems-quantity">
                          {cartItem.quantity}
                        </button>
                      </span>
                    </div>
                    <div className="cartitem-field">
                      <span className="value">
                        Rs.{cartItem.price * cartItem.quantity}
                      </span>
                    </div>
                    <div className="cartitem-field">
                      <span className="value">
                        <img
                          src={remove_icon}
                          alt="Remove"
                          className="cart-items-remove"
                          onClick={() => removeFromCart(key)}
                        />
                      </span>
                    </div>
                  </div>
                  <hr />
                </React.Fragment>
              );
            })
          )}
        </div>
      </section>

      <section className="profile-section">
        <h2>Order History</h2>
        {orders.length === 0 ? (
          <p>No orders found</p>
        ) : (
          <table className="order-history-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Total (Rs.)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderId}>
                  <td>{order.orderId}</td>
                  <td>
                    {order?.date
                      ? new Date(order.date).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td>{(order.total || 0).toLocaleString()}</td>
                  <td
                    className={`status-${(order.status || "").toLowerCase()}`}
                  >
                    {order.status || "N/A"}
                  </td>
                  <td>
                    <button
                      className="remove-order-btn"
                      onClick={() => removeOrder(order.orderId)}
                      disabled={["Shipped", "Delivered"].includes(order.status)}
                      title={
                        ["Shipped", "Delivered"].includes(order.status)
                          ? "Cannot remove shipped/delivered orders"
                          : "Remove order"
                      }
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default UserProfile;
