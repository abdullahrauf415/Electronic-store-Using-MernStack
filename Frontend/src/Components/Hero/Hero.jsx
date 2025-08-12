import React, { useEffect } from "react";
import "./Hero.css";

const Hero = ({ onShopClick }) => {
  useEffect(() => {
    // Gadget animation initialization
    const gadgets = document.querySelectorAll(".gadget");
    gadgets.forEach((gadget, i) => {
      gadget.style.animationDelay = `${i * 0.5}s`;
    });
  }, []);

  return (
    <div className="hero-container">
      {/* Animated gadgets */}
      <div className="gadget gadget-1"></div>
      <div className="gadget gadget-2"></div>
      <div className="gadget gadget-3"></div>
      <div className="gadget gadget-4"></div>

      {/* Hero content */}
      <div className="hero-content">
        <h1 className="hero-title">
          <span className="highlight">Gadgets</span> Store
          <span className="hero-icon">🚀</span>
        </h1>

        <p className="hero-subtitle">
          Discover cutting-edge technology for the modern lifestyle
        </p>

        <div className="hero-features">
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <span>Latest Devices</span>
          </div>
          <div className="feature">
            <div className="feature-icon">🔒</div>
            <span>Secure Shopping</span>
          </div>
          <div className="feature">
            <div className="feature-icon">🚚</div>
            <span>Free Delivery</span>
          </div>
        </div>

        <button className="hero-btn" onClick={onShopClick}>
          <span>Shop Now</span>
          <div className="arrow-icon">→</div>
        </button>
      </div>

      {/* Decorative elements */}
      <div className="circle-decor circle-1"></div>
      <div className="circle-decor circle-2"></div>
    </div>
  );
};

export default Hero;
