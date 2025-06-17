import React, { useContext, useRef, useState } from "react";
import HomeContext from "../Context/HomeContext";
import "../pages/CSS/PaymentConfirmation.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useLocation } from "react-router-dom";

const PaymentConfirmation = () => {
  const location = useLocation();
  const { method, name, phone, address } = location.state || {};
  const {
    products,
    cartItems,
    getTotalCartAmount,
    selectedPaymentMethod,
    user,
    clearCart,
  } = useContext(HomeContext);
  const isCartEmpty = Object.keys(cartItems).length === 0;
  const receiptRef = useRef();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const downloadReceipt = () => {
    const input = receiptRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("receipt.pdf");
    });
  };

  const placeOrder = async () => {
    if (isCartEmpty) return;

    setLoading(true);
    setMessage(null);

    try {
      // Prepare items array with required structure
      const items = Object.values(cartItems)
        .map((cartItem) => {
          const product = products.find((p) => p.id === cartItem.id);
          return product
            ? {
                name: product.name,
                quantity: cartItem.quantity,
                price: cartItem.price,
                size: cartItem.size,
                color: cartItem.color,
              }
            : null;
        })
        .filter((item) => item !== null);

      const orderData = {
        email: user.email,
        items,
        total: getTotalCartAmount(),
        paymentMethod: selectedPaymentMethod,
        transactionId: `TXN${Date.now()}`,
        address: user.address || "No address provided",
        phone: user.phone || "No phone provided",
        name: user.name || "No name provided",
      };

      const response = await fetch("http://localhost:3000/place-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to place order");
      }

      setMessage("Order placed successfully!");
      clearCart();
    } catch (error) {
      setMessage(
        error.message || "Something went wrong while placing the order."
      );
      console.error("Order Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-confirmation">
      <div className="success-animation">
        <svg
          className="checkmark"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 52 52"
        >
          <circle
            className="checkmark__circle"
            cx="26"
            cy="26"
            r="25"
            fill="none"
          />
          <path className="checkmark__check" fill="none" d="M14 27l7 7 16-16" />
        </svg>
        <h1>Payment Successful!</h1>
      </div>
      <div className="customer-details">
        <h3>Customer Information</h3>
        <p>
          <strong>Name:</strong> {name}
        </p>
        <p>
          <strong>Phone:</strong> {phone}
        </p>
        <p>
          <strong>Delivery Address:</strong> {address}
        </p>
      </div>
      {isCartEmpty ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div ref={receiptRef} className="receipt-content">
            <div className="confirmation-items-header">
              <p>Product</p>
              <p>Title</p>
              <p>Variant</p>
              <p>Price</p>
              <p>Quantity</p>
              <p>Total</p>
            </div>
            <hr />

            {Object.entries(cartItems).map(([key, cartItem]) => {
              const product = products.find((p) => p.id === cartItem.id);
              if (!product) return null;

              return (
                <div key={key} className="confirmation-item">
                  <div className="confirmation-field">
                    <img
                      src={product.image[0]}
                      alt={product.name}
                      className="confirmation-product-icon"
                    />
                  </div>
                  <div className="confirmation-field">
                    <span>{product.name}</span>
                  </div>
                  <div className="confirmation-field">
                    <span className="variant">
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
                  <div className="confirmation-field">
                    <span>Rs.{cartItem.price}</span>
                  </div>
                  <div className="confirmation-field">
                    <span>{cartItem.quantity}</span>
                  </div>
                  <div className="confirmation-field">
                    <span>Rs.{cartItem.price * cartItem.quantity}</span>
                  </div>
                </div>
              );
            })}

            <div className="confirmation-summary">
              <div className="summary-item">
                <p>Subtotal</p>
                <p>Rs.{getTotalCartAmount()}</p>
              </div>
              <div className="summary-item">
                <p>Shipping Fee</p>
                <p>Free</p>
              </div>
              <div className="summary-item total">
                <h3>Total</h3>
                <h3>Rs.{getTotalCartAmount()}</h3>
              </div>
              <div className="summary-item payment-method">
                <p>Payment Method:</p>
                <p>{method || "N/A"}</p>
              </div>
            </div>
          </div>
          <button
            className="confirm-order-btn"
            onClick={placeOrder}
            disabled={loading}
          >
            {loading ? "Placing Order..." : "Confirm Order"}
          </button>

          <button className="download-receipt-btn" onClick={downloadReceipt}>
            Download Receipt
          </button>

          {message && <p className="order-message">{message}</p>}
        </>
      )}
    </div>
  );
};

export default PaymentConfirmation;
