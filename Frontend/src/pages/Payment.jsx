import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "./CSS/Payment.css";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { name, phone, address, orderNo, amount } = location.state || {};

  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardBrand, setCardBrand] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card"); // 'card' or 'cod'

  // Format card number with spaces
  const formatCardNumber = (value) => {
    return value
      .replace(/\D/g, "")
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  // Format expiry date as MM/YY
  const formatExpiryDate = (value) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 2) + "/" + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const isFormValid = () => {
    if (paymentMethod === "card") {
      return cardBrand && cardNumber && expiryDate && cvv && cardName;
    }
    return true; // For COD, no additional validation needed
  };

  const handleFormSubmit = () => {
    if (!isFormValid()) {
      setErrorMessage("Please fill out all fields.");
    } else {
      setErrorMessage("");
      setShowConfirmation(true);
    }
  };

  const handlePaymentConfirmation = () => {
    navigate("/payment-confirmation", {
      state: {
        name,
        phone,
        address,
        orderNo,
        amount,
        method: paymentMethod === "card" ? cardBrand : "Cash on Delivery",
        transactionId:
          paymentMethod === "card"
            ? "Txn-" + Math.floor(Math.random() * 1000000000)
            : "COD-" + Math.floor(Math.random() * 1000000),
        status: "pending",
      },
    });
  };

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

      {paymentMethod === "card" ? (
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
      ) : (
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
        disabled={!isFormValid()}
      >
        {paymentMethod === "card" ? `Pay RS${amount}` : `Confirm COD Order`}
      </button>

      {showConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h2>Confirm {paymentMethod === "card" ? "Payment" : "Order"}</h2>
            <p>
              <strong>Name:</strong> {name}
            </p>
            <p>
              <strong>Phone:</strong> {phone}
            </p>
            <p>
              <strong>Address:</strong> {address}
            </p>
            <p>
              <strong>Order No:</strong> #{orderNo}
            </p>
            <p>
              <strong>Amount:</strong> RS.
              {paymentMethod === "card" ? amount : amount + 50}
            </p>
            <p>
              <strong>Payment Method:</strong>{" "}
              {paymentMethod === "card" ? cardBrand : "Cash on Delivery"}
            </p>
            <div className="modal-actions">
              <button
                className="confirm-button"
                onClick={handlePaymentConfirmation}
              >
                {paymentMethod === "card" ? "Confirm Payment" : "Place Order"}
              </button>
              <button
                className="cancel-button"
                onClick={() => setShowConfirmation(false)}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <Link to="/checkout" className="back-link">
        ← Return to Checkout
      </Link>
    </div>
  );
};

export default Payment;
