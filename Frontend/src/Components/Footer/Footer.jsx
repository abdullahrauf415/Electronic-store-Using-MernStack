import React from "react";
import "./Footar.css";
import footer_logo from "../Assets/logo_big.png";
import instagram_icon from "../Assets/instagram_icon.png";
import facebook_icon from "../Assets/facebook_icon.png";
import Whatsapp_icon from "../Assets/whatsapp_icon.png";
const Footer = () => {
  return (
    <div className="footer">
      <div className="footer-logo">
        <img src={footer_logo} />
        <p>GadgetStore</p>
      </div>
      <ul className="footer-links">
        <li>Support</li>
        <li>About Us</li>
        <li>Contact Us</li>
      </ul>
      <div className="footer-social-icon">
        <div className="footer-icon-container">
          <img src={instagram_icon} />
        </div>
        <div className="footer-icon-container">
          <img src={facebook_icon} />
        </div>
        <div className="footer-icon-container">
          <img src={Whatsapp_icon} />
        </div>
      </div>
      <div className="footer-copyright">
        <hr />
        <p>Copyright © 2023 GadgetStore. All rights reserved.</p>
      </div>
    </div>
  );
};

export default Footer;
