import { useContext, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import HomeContext from "../Context/HomeContext";
import "./CSS/Checkout.css";

const Checkout = () => {
  const { getTotalCartAmount } = useContext(HomeContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [orderNo, setOrderNo] = useState("");

  const [errors, setErrors] = useState({ name: "", phone: "", address: "" });

  useEffect(() => {
    const randomOrderNo = Math.floor(100 + Math.random() * 90000);
    setOrderNo(randomOrderNo);
  }, []);

  const handleMapSelect = () => {
    alert("Map location selector coming soon!");
  };

  const handleProceed = () => {
    const newErrors = { name: "", phone: "", address: "" };
    let hasError = false;

    if (name.trim() === "") {
      newErrors.name = "Enter your name first.";
      hasError = true;
    }
    if (phone.trim() === "") {
      newErrors.phone = "Enter your phone number first.";
      hasError = true;
    }
    if (address.trim() === "") {
      newErrors.address = "Enter your address first.";
      hasError = true;
    }

    setErrors(newErrors);

    if (!hasError) {
      navigate("/payment", {
        state: {
          name,
          phone,
          address,
          orderNo,
          amount: getTotalCartAmount(),
          method: "Cash on Delivery",
          transactionId: "N/A",
          status: "pending",
        },
      });
    }
  };

  return (
    <div className="checkout-card">
      <h2 className="checkout-title">Step 2: Delivery Details</h2>
      <div className="order-card">
        <h3>Order Summary</h3>
        <div className="price-row">
          <span>Order No:</span>
          <span>#{orderNo}</span>
        </div>
        <div className="price-row">
          <span>Subtotal:</span>
          <span>Rs.{getTotalCartAmount()}</span>
        </div>
        <div className="price-row">
          <span>Shipping:</span>
          <span>Free</span>
        </div>
        <div className="total">
          <span>Total:</span>
          <span>Rs.{getTotalCartAmount()}</span>
        </div>
      </div>

      <div className="address-card">
        <h3>Delivery Details</h3>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          className="checkout-input"
        />
        {errors.name && <div className="error-text">{errors.name}</div>}

        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          className="checkout-input"
        />
        {errors.phone && <div className="error-text">{errors.phone}</div>}

        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter full delivery address"
          rows={4}
          className="checkout-textarea"
        />
        {errors.address && <div className="error-text">{errors.address}</div>}

        <button className="map-select-btn" onClick={handleMapSelect}>
          📍 Select from Map
        </button>
      </div>
      <Link to="/Cart" className="back-link">
        ← Return to Cart
      </Link>
      <button onClick={handleProceed} className="checkout-button">
        Proceed to Payment →
      </button>
    </div>
  );
};

export default Checkout;
