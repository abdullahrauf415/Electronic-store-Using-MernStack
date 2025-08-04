import React, { useState, useContext, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import HomeContext from "../Context/HomeContext";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./CSS/Payment.css";

const Payment = () => {
  const location = useLocation();
  const { clearCart, products, cartItems, getTotalCartAmount } =
    useContext(HomeContext);
  const { name, phone, address, orderNo, amount } = location.state || {};
  const receiptRef = useRef();

  // Payment method states
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Card payment fields
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardBrand, setCardBrand] = useState("");

  // Bank transfer fields
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [transactionId, setTransactionId] = useState("");

  // Mobile wallet fields
  const [mobileNumber, setMobileNumber] = useState("");
  const [cnic, setCnic] = useState("");

  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    switch (paymentMethod) {
      case "card":
        return (
          cardBrand &&
          cardNumber.replace(/\s/g, "").length === 16 &&
          expiryDate.length === 5 &&
          cvv.length === 3 &&
          cardName
        );

      case "bank":
        return bankName && accountNumber && accountTitle && transactionId;

      case "easypaisa":
      case "jazzcash":
        return mobileNumber.length === 11 && cnic.length === 13;

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
      case "bank":
        return "Bank Transfer";
      case "easypaisa":
        return "EasyPaisa";
      case "jazzcash":
        return "JazzCash";
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

    // Simulate payment processing
    setTimeout(() => {
      clearCart();
      setIsPaymentConfirmed(true);
      setLoading(false);
    }, 1500);
  };

  const downloadReceipt = () => {
    const input = receiptRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`receipt-${orderNo}.pdf`);
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
          <button className="download-receipt-btn" onClick={downloadReceipt}>
            Download Receipt
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
          className={`method-btn ${paymentMethod === "bank" ? "active" : ""}`}
          onClick={() => setPaymentMethod("bank")}
        >
          Bank Transfer
        </button>
        <button
          className={`method-btn ${
            paymentMethod === "easypaisa" ? "active" : ""
          }`}
          onClick={() => setPaymentMethod("easypaisa")}
        >
          EasyPaisa
        </button>
        <button
          className={`method-btn ${
            paymentMethod === "jazzcash" ? "active" : ""
          }`}
          onClick={() => setPaymentMethod("jazzcash")}
        >
          JazzCash
        </button>
        <button
          className={`method-btn ${paymentMethod === "cod" ? "active" : ""}`}
          onClick={() => setPaymentMethod("cod")}
        >
          Cash on Delivery
        </button>
      </div>

      {/* Card Payment Form */}
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

      {/* Bank Transfer Form */}
      {paymentMethod === "bank" && (
        <div className="bank-form">
          <div className="form-group">
            <label>Bank Name</label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            >
              <option value="">Select Bank</option>
              <option value="HBL">HBL</option>
              <option value="UBL">UBL</option>
              <option value="MCB">MCB</option>
              <option value="Allied Bank">Allied Bank</option>
              <option value="Bank Alfalah">Bank Alfalah</option>
              <option value="Meezan Bank">Meezan Bank</option>
            </select>
          </div>

          <div className="form-group">
            <label>Account Title</label>
            <input
              type="text"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              placeholder="e.g., Muhammad Abdullah"
              required
            />
          </div>

          <div className="form-group">
            <label>Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) =>
                setAccountNumber(e.target.value.replace(/\D/g, ""))
              }
              placeholder="e.g., 123456789"
              maxLength={20}
              required
            />
          </div>

          <div className="form-group">
            <label>Transaction ID</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter bank transaction ID"
              required
            />
          </div>

          <div className="bank-instructions">
            <h4>Transfer Instructions:</h4>
            <p>1. Transfer the amount to the following account:</p>
            <p>
              <strong>Account Name:</strong> Electronics Store
            </p>
            <p>
              <strong>Account Number:</strong> PK12 ABCD 1234 5678 9012 3456
            </p>
            <p>
              <strong>Bank:</strong> HBL
            </p>
            <p>
              2. After transfer, enter your details above and click "Confirm
              Bank Transfer"
            </p>
          </div>
        </div>
      )}

      {/* EasyPaisa Form */}
      {paymentMethod === "easypaisa" && (
        <div className="mobile-wallet-form">
          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) =>
                setMobileNumber(
                  e.target.value.replace(/\D/g, "").substring(0, 11)
                )
              }
              placeholder="03XX XXXXXX"
              required
            />
          </div>

          <div className="form-group">
            <label>CNIC Number</label>
            <input
              type="text"
              value={cnic}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                // Format as XXXXX-XXXXXXX-X
                if (val.length <= 13) {
                  setCnic(val);
                }
              }}
              placeholder="XXXXX-XXXXXXX-X"
              maxLength={15}
              required
            />
          </div>

          <div className="form-group">
            <label>Transaction ID</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter EasyPaisa transaction ID"
              required
            />
          </div>

          <div className="wallet-instructions">
            <h4>EasyPaisa Payment Instructions:</h4>
            <p>1. Open your EasyPaisa app</p>
            <p>2. Go to "Send Money"</p>
            <p>
              3. Enter our EasyPaisa Account: <strong>0312 3456789</strong>
            </p>
            <p>
              4. Enter amount: <strong>Rs. {amount}</strong>
            </p>
            <p>5. Complete the transaction and enter details above</p>
          </div>
        </div>
      )}

      {/* JazzCash Form */}
      {paymentMethod === "jazzcash" && (
        <div className="mobile-wallet-form">
          <div className="form-group">
            <label>Mobile Number</label>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) =>
                setMobileNumber(
                  e.target.value.replace(/\D/g, "").substring(0, 11)
                )
              }
              placeholder="03XX XXXXXX"
              required
            />
          </div>

          <div className="form-group">
            <label>CNIC Number</label>
            <input
              type="text"
              value={cnic}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                // Format as XXXXX-XXXXXXX-X
                if (val.length <= 13) {
                  setCnic(val);
                }
              }}
              placeholder="XXXXX-XXXXXXX-X"
              maxLength={15}
              required
            />
          </div>

          <div className="form-group">
            <label>Transaction ID</label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter JazzCash transaction ID"
              required
            />
          </div>

          <div className="wallet-instructions">
            <h4>JazzCash Payment Instructions:</h4>
            <p>1. Open your JazzCash app</p>
            <p>2. Go to "Send Money"</p>
            <p>
              3. Enter our JazzCash Account: <strong>0300 1234567</strong>
            </p>
            <p>
              4. Enter amount: <strong>Rs. {amount}</strong>
            </p>
            <p>5. Complete the transaction and enter details above</p>
          </div>
        </div>
      )}

      {/* Cash on Delivery */}
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
          : paymentMethod === "cod"
          ? `Confirm COD Order (RS.${amount + 50})`
          : `Confirm ${getPaymentMethodDisplay()} Payment`}
      </button>

      <Link to="/checkout" className="back-link">
        ← Return to Checkout
      </Link>
    </div>
  );
};

export default Payment;
