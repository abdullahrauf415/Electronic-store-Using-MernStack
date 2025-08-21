import React, { useContext } from "react";
import CartItems from "../Components/CartItems/CartItems";
import HomeContext from "../Context/HomeContext";
import { Link } from "react-router-dom";
import "./CSS/Cart.css";

const Cart = () => {
  const { isAdmin, isLoggedIn, logout } = useContext(HomeContext);

  if (isLoggedIn && isAdmin) {
    return (
      <div className="admin-cart-message">
        <div className="admin-cart-container">
          <h2>Admin Account Detected</h2>
          <p>
            Admins cannot place orders. Please use a customer account to make
            purchases.
          </p>

          <div className="admin-cart-options">
            <Link to="/" className="continue-shopping-btn">
              Continue Shopping
            </Link>

            <button onClick={logout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <CartItems />
    </div>
  );
};

export default Cart;
