import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import HomeContext from "../Context/HomeContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./CSS/Payment.css";

const Payment = () => {
  const location = useLocation();
  const { cartItems, clearCart, products, user, getTotalCartAmount } =
    useContext(HomeContext);

  const {
    name,
    phone,
    address,
    orderNo,
    amount,
    totalCartAmount = getTotalCartAmount(),
  } = location.state || {};

  const receiptRef = useRef();

  const [paymentMethod, setPaymentMethod] = useState("card");

  // Card payment fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardBrand, setCardBrand] = useState("");

  const [transactionId, setTransactionId] = useState(
    paymentMethod === "cod" ? `COD-${Date.now()}` : ""
  );

  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const [receiptData, setReceiptData] = useState({
    cartItems: {},
    totalCartAmount: 0,
  });

  useEffect(() => {
    if (isPaymentConfirmed && products.length > 0) {
      const imageUrls = [];
      Object.entries(receiptData.cartItems).forEach(([key, cartItem]) => {
        const product = products.find((p) => p.id === cartItem.id);
        if (product && product.image && product.image[0]) {
          imageUrls.push(product.image[0]);
        }
      });
      const loadImage = (url) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.src = url;
          img.onload = resolve;
          img.onerror = resolve;
        });
      };
      Promise.all(imageUrls.map((url) => loadImage(url)))
        .then(() => setImagesLoaded(true))
        .catch(() => setImagesLoaded(true));
    }
  }, [isPaymentConfirmed, receiptData.cartItems, products]);

  const formatCardNumber = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const isFormValid = () => {
    switch (paymentMethod) {
      case "card":
        return (
          cardBrand &&
          cardNumber.replace(/\s/g, "").length === 16 &&
          expiryDate.length === 5 &&
          cvv.length === 3 &&
          cardName
        );
      case "cod":
        return true;
      default:
        return false;
    }
  };

  const getPaymentMethodDisplay = () => {
    switch (paymentMethod) {
      case "card":
        return cardBrand;
      case "cod":
        return "Cash on Delivery";
      default:
        return "";
    }
  };

  const getTotalAmount = () => {
    return paymentMethod === "cod" ? amount + 50 : amount;
  };

  const handleFormSubmit = async () => {
    if (!isFormValid()) {
      setErrorMessage("Please fill out all required fields.");
      return;
    }

    setErrorMessage("");
    setLoading(true);

    try {
      let txnId = transactionId;
      if (paymentMethod === "cod" && !txnId) {
        txnId = `COD-${Date.now()}`;
        setTransactionId(txnId);
      }

      const orderData = {
        email: user?.email || "",
        items: Object.values(cartItems).map((item) => {
          const product = products.find((p) => p.id === item.id);
          return {
            id: item.id,
            name: product?.name || "Unknown Product",
            quantity: item.quantity,
            price: item.price,
            size: item.size,
            color: item.color,
          };
        }),
        total: getTotalAmount(),
        paymentMethod,
        transactionId: txnId,
        address,
        phone,
        name,
      };

      const response = await fetch("http://localhost:3000/place-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Order placement failed");
      }

      setReceiptData({
        cartItems: { ...cartItems },
        totalCartAmount,
      });

      clearCart();
      setIsPaymentConfirmed(true);
    } catch (error) {
      setErrorMessage(
        error.message || "Failed to place order. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadReceipt = () => {
    if (!imagesLoaded) {
      alert("Please wait for images to load before downloading receipt.");
      return;
    }
    const input = receiptRef.current;
    const images = input.getElementsByTagName("img");
    const imagePromises = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.complete) {
        const promise = new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
        imagePromises.push(promise);
      }
    }
    Promise.all(imagePromises).then(() => {
      html2canvas(input, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      }).then((canvas) => {
        const imgData = canvas.toDataURL("image/png", 1.0);
        const pdf = new jsPDF("p", "mm", "a4");
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const margin = 10;
        const contentWidth = pdfWidth - margin * 2;
        const contentHeight = (imgProps.height * contentWidth) / imgProps.width;
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          contentWidth,
          contentHeight
        );
        pdf.save(`receipt-${orderNo}.pdf`);
      });
    });
  };

  const getFormattedDate = () => {
    const now = new Date();
    return now.toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isPaymentConfirmed) {
    return (
      <div className="payment-confirmation">
        {/* Success Message */}
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
            <path
              className="checkmark__check"
              fill="none"
              d="M14 27l7 7 16-16"
            />
          </svg>
          <h1>Payment Successful!</h1>
        </div>

        {/* Order Summary */}
        <div className="order-summary">
          <p>
            <strong>Order Number:</strong> #{orderNo}
          </p>
          <p>
            <strong>Transaction ID:</strong>{" "}
            {transactionId || `Txn-${Math.floor(Math.random() * 1000000000)}`}
          </p>
          <p>
            <strong>Payment Method:</strong> {getPaymentMethodDisplay()}
          </p>
          <p>
            <strong>Amount Paid:</strong> Rs.{getTotalAmount()}
          </p>
          <p>
            <strong>Date:</strong> {getFormattedDate()}
          </p>
        </div>

        {/* Customer Details */}
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

        {/* Receipt */}
        <div ref={receiptRef} className="receipt-content">
          <h2 className="receipt-header">Order Receipt</h2>
          <div className="receipt-details">
            <p>
              <strong>Order Number:</strong> #{orderNo}
            </p>
            <p>
              <strong>Date:</strong> {getFormattedDate()}
            </p>
          </div>

          <div className="confirmation-items-header">
            <p>Product</p>
            <p>Title</p>
            <p>Variant</p>
            <p>Price</p>
            <p>Quantity</p>
            <p>Total</p>
          </div>
          <hr />

          {Object.entries(receiptData.cartItems).map(([key, cartItem]) => {
            const product = products.find((p) => p.id === cartItem.id);
            if (!product) return null;
            return (
              <div key={key} className="confirmation-item">
                <div className="confirmation-field">
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="confirmation-product-icon"
                    crossOrigin="anonymous"
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
              <p>Rs.{receiptData.totalCartAmount}</p>
            </div>
            {paymentMethod === "cod" && (
              <div className="summary-item">
                <p>COD Fee</p>
                <p>Rs.50</p>
              </div>
            )}
            <div className="summary-item">
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <div className="summary-item total">
              <h3>Total</h3>
              <h3>Rs.{getTotalAmount()}</h3>
            </div>
            <div className="summary-item payment-method">
              <p>Payment Method:</p>
              <p>{getPaymentMethodDisplay()}</p>
            </div>
            <div className="summary-item">
              <p>Transaction ID:</p>
              <p>{transactionId || "N/A"}</p>
            </div>
          </div>

          <div className="thank-you-note">
            <p>
              Thank you for your purchase! Your order will be processed within
              24 hours.
            </p>
            <p>For any inquiries, contact support@electronix.com</p>
          </div>
        </div>

        <div className="confirmation-actions">
          <button
            className="download-receipt-btn"
            onClick={downloadReceipt}
            disabled={!imagesLoaded}
          >
            {imagesLoaded ? "Download Receipt" : "Loading Images..."}
          </button>
          <Link to="/" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <h1>Payment</h1>
      <hr />

      <div className="payment-method-selector">
        <button
          className={`method-btn ${paymentMethod === "card" ? "active" : ""}`}
          onClick={() => setPaymentMethod("card")}
        >
          Credit/Debit Card
        </button>
        <button
          className={`method-btn ${paymentMethod === "cod" ? "active" : ""}`}
          onClick={() => setPaymentMethod("cod")}
        >
          Cash on Delivery
        </button>
      </div>

      {/* Card Payment */}
      {paymentMethod === "card" && (
        <>
          <div className="form-group">
            <label>Select Card:</label>
            <div className="card-brand-options">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png"
                alt="Visa"
                className={cardBrand === "Visa" ? "selected" : ""}
                onClick={() => setCardBrand("Visa")}
              />
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/0/04/Mastercard-logo.png"
                alt="MasterCard"
                className={cardBrand === "MasterCard" ? "selected" : ""}
                onClick={() => setCardBrand("MasterCard")}
              />
            </div>
          </div>

          <div className="card-form">
            <div className="form-group">
              <label>Name on Card</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="e.g., Muhammad Abdullah"
              />
            </div>
            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) =>
                  setCardNumber(formatCardNumber(e.target.value))
                }
                placeholder="0000 0000 0000 0000"
                maxLength={19}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Date</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) =>
                    setExpiryDate(formatExpiryDate(e.target.value))
                  }
                  placeholder="MM/YY"
                  maxLength={5}
                />
              </div>
              <div className="form-group">
                <label>CVV</label>
                <input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                  placeholder="XXX"
                  maxLength={3}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* COD */}
      {paymentMethod === "cod" && (
        <div className="cod-info">
          <h3>Cash on Delivery</h3>
          <p>
            Pay with cash when your order is delivered. An additional RS.50 will
            be charged for COD orders.
          </p>
          <p className="cod-total">
            Total Payable: <strong>RS.{amount + 50}</strong>
          </p>
        </div>
      )}

      {errorMessage && <p className="error-message">{errorMessage}</p>}

      <button
        className="confirm-button"
        onClick={handleFormSubmit}
        disabled={!isFormValid() || loading}
      >
        {loading
          ? "Processing..."
          : paymentMethod === "card"
          ? `Pay RS.${amount}`
          : `Confirm COD Order (RS.${amount + 50})`}
      </button>

      <Link to="/checkout" className="back-link">
        ← Return to Checkout
      </Link>
    </div>
  );
};

export default Payment;
