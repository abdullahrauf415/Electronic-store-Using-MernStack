import React from "react";
import "./Hero.css";

const Hero = ({ onShopClick }) => {
  return (
    <div className="hero-wrapper">
      <div className="hero-card animate-fade-in">
        <h1>💡 Welcome to Our Store</h1>
        <p>Explore our collection of gadgets</p>
        <button className="hero-btn" onClick={onShopClick}>
          Shop Now
        </button>
      </div>
    </div>
  );
};

export default Hero;
