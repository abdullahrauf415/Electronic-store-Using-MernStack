import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import HomeContext from "../../Context/HomeContext";
import remove_icon from "../Assets/cart_cross_icon.png";
import "./CartItems.css";

const CartItems = () => {
  const {
    getTotalCartAmount,
    products,
    cartItems,
    removeFromCart,
    isLoggedIn,
  } = useContext(HomeContext);

  const navigate = useNavigate();
  const [isRemoving, setIsRemoving] = useState(null);
  const isCartEmpty = Object.keys(cartItems).length === 0;

  // Calculate delivery charges
  const deliveryCharge = getTotalCartAmount() > 100000 ? 0 : 200;
  const totalAmount = getTotalCartAmount() + deliveryCharge;

  const handleProceed = () => {
    if (!isLoggedIn) {
      navigate("/login");
    } else if (!isCartEmpty) {
      navigate("/Checkout");
    }
  };

  const handleRemove = (key) => {
    setIsRemoving(key);
    setTimeout(() => {
      removeFromCart(key);
      setIsRemoving(null);
    }, 500);
  };

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
        <div className="cart-steps">
          <div className="cart-step active">Cart</div>
          <div className="cart-step">Delivery</div>
          <div className="cart-step">Payment</div>
        </div>
      </div>

      <div className="cart-items">
        <div className="cart-grid-header">
          <div className="cart-header-item">Product</div>
          <div className="cart-header-item">Title</div>
          <div className="cart-header-item">Variant</div>
          <div className="cart-header-item">Price</div>
          <div className="cart-header-item">Quantity</div>
          <div className="cart-header-item">Total</div>
          <div className="cart-header-item">Remove</div>
        </div>
        <hr className="cart-divider" />

        {isCartEmpty ? (
          <div className="cart-empty">
            <div className="empty-cart-icon">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet</p>
            <button onClick={() => navigate("/")} className="shop-btn">
              Continue Shopping
            </button>
          </div>
        ) : (
          Object.entries(cartItems).map(([key, cartItem]) => {
            const product = products.find((p) => p.id === cartItem.id);
            if (!product) return null;
            const uniqueKey = `${cartItem.id}-${cartItem.size}-${cartItem.color}`;

            return (
              <div
                key={uniqueKey}
                className={`cart-item ${isRemoving === key ? "removing" : ""}`}
              >
                <div className="cart-item-cell">
                  <div className="cart-product-image">
                    <img
                      src={product.image[0]}
                      alt={product.name}
                      className="product-thumbnail"
                    />
                  </div>
                </div>

                <div className="cart-item-cell">
                  <div className="cart-product-name">{product.name}</div>
                </div>

                <div className="cart-item-cell">
                  <div className="cart-variants">
                    {cartItem.size && (
                      <span className="variant-tag size">{cartItem.size}</span>
                    )}
                    {cartItem.color && (
                      <span className="variant-tag color">
                        {cartItem.color}
                      </span>
                    )}
                  </div>
                </div>

                <div className="cart-item-cell">
                  <div className="cart-price">
                    Rs.{cartItem.price.toLocaleString()}
                  </div>
                </div>

                <div className="cart-item-cell">
                  <div className="cart-quantity">
                    <span className="quantity-badge">{cartItem.quantity}</span>
                  </div>
                </div>

                <div className="cart-item-cell">
                  <div className="cart-total">
                    Rs.{(cartItem.price * cartItem.quantity).toLocaleString()}
                  </div>
                </div>

                <div className="cart-item-cell">
                  <div
                    className="cart-remove"
                    onClick={() => handleRemove(key)}
                  >
                    <img
                      src={remove_icon}
                      alt="Remove"
                      className="remove-icon"
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {!isCartEmpty && (
        <div className="cart-summary">
          <div className="summary-card">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>Rs.{getTotalCartAmount().toLocaleString()}</span>
            </div>

            <div className="summary-row">
              <span>Delivery Fee</span>
              <span className={deliveryCharge === 0 ? "free-delivery" : ""}>
                {deliveryCharge === 0 ? "FREE" : `Rs.${deliveryCharge}`}
              </span>
            </div>

            {deliveryCharge === 0 && (
              <div className="delivery-message">
                🎉 Free delivery on orders over Rs.100,000
              </div>
            )}

            <div className="summary-row total-row">
              <span>Total</span>
              <span>Rs.{totalAmount.toLocaleString()}</span>
            </div>

            <button
              onClick={handleProceed}
              className={`checkout-btn ${!isLoggedIn ? "login-prompt" : ""}`}
            >
              {isLoggedIn ? "Proceed to Checkout" : "Login to Checkout"}
              <span className="arrow">→</span>
            </button>

            <div className="secure-checkout">
              <div className="lock-icon">🔒</div>
              <span>Secure Checkout</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartItems;
