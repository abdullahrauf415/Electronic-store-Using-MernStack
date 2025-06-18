import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./CartItems.css";
import HomeContext from "../../Context/HomeContext";
import remove_icon from "../Assets/cart_cross_icon.png";

const CartItems = () => {
  const {
    getTotalCartAmount,
    products,
    cartItems,
    removeFromCart,
    isLoggedIn,
  } = useContext(HomeContext);
  const navigate = useNavigate();
  const isCartEmpty = Object.keys(cartItems).length === 0;
  const handleProceed = () => {
    if (!isLoggedIn) {
      navigate("/login");
    } else if (!isCartEmpty) {
      navigate("/Checkout");
    }
  };

  return (
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

      {isCartEmpty ? (
        <p className="cart-empty-message">Your cart is empty.</p>
      ) : (
        Object.entries(cartItems).map(([key, cartItem]) => {
          const product = products.find((p) => p.id === cartItem.id);
          if (!product) return null;
          const uniqueKey = `${cartItem.id}-${cartItem.size}-${cartItem.color}`;
          return (
            <div key={uniqueKey} className="cartitem-format">
              <div className="cartitem-field">
                <span className="value">
                  <img
                    src={product.image[0]}
                    alt={product.name}
                    className="carticon-product-icon"
                  />
                </span>
              </div>
              <div className="cartitem-field">
                <span className="value">{product.name}</span>
              </div>
              <div className="cartitem-field">
                <span className="value variant">
                  {cartItem.size && (
                    <span className="variant-badge size">{cartItem.size}</span>
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
          );
        })
      )}

      <div className="cartitems-down">
        <div className="cartitems-down-total">
          <h1>Cart Total</h1>
          <div>
            <div className="cart-item-total-item">
              <p>Subtotal</p>
              <p>Rs.{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-item-total-item">
              <p>Shipping Fee</p>
              <p>Free</p>
            </div>
            <hr />
            <div className="cart-item-total-item">
              <h3>Total</h3>
              <h3>Rs.{getTotalCartAmount()}</h3>
            </div>
            <button
              onClick={handleProceed}
              disabled={isCartEmpty}
              className={!isLoggedIn ? "disabled-btn" : ""}
            >
              {isLoggedIn ? "Proceed to Checkout" : "Login to Checkout"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItems;
