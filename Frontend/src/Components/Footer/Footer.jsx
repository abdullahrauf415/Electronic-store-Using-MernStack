import React, { useState, useEffect } from "react";
import "./Footer.css";
import footer_logo from "../Assets/logo_big.png";
import instagram_icon from "../Assets/instagram_icon.png";
import facebook_icon from "../Assets/facebook_icon.png";
import Whatsapp_icon from "../Assets/whatsapp_icon.png";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const Footer = () => {
  const [faqs, setFaqs] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [socialLinks, setSocialLinks] = useState({
    instagram: "#",
    facebook: "#",
    whatsapp: "#",
  });

  const [activeSection, setActiveSection] = useState(null); // NEW

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch("/api/faqs");
        const data = await response.json();
        if (data.success) {
          setFaqs(data.faqs);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs:", error);
      }
    };

    const fetchSocialLinks = async () => {
      try {
        const response = await fetch("/api/social-media");
        const data = await response.json();
        if (data.success) {
          const links = {};
          data.links.forEach((link) => {
            links[link.platform] = link.url;
          });
          setSocialLinks(links);
        }
      } catch (error) {
        console.error("Failed to fetch social links:", error);
      }
    };

    fetchFaqs();
    fetchSocialLinks();
  }, []);

  const toggleFaq = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:3000/api/generate-faq-pdf",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "FAQs.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download FAQ PDF");
    }
  };

  const renderActiveSection = () => {
    switch (activeSection) {
      case "support":
        return (
          <p>
            For any queries or technical support, please email
            support@gadgetstore.com.
          </p>
        );
      case "about":
        return (
          <p>
            GadgetStore is your one-stop solution for latest gadgets and
            electronics at best prices.
          </p>
        );
      case "contact":
        return (
          <p>
            You can contact us via email: contact@gadgetstore.com or call us at
            +92-123-4567890.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="footer">
      <div className="footer-logo">
        <img src={footer_logo} alt="GadgetStore Logo" />
        <p>GadgetStore</p>
      </div>

      <div className="footer-content">
        <div className="footer-links-section">
          <h4>Quick Links</h4>
          <ul className="footer-links">
            <li>
              <a onClick={() => setActiveSection("support")}>Support</a>
            </li>
            <li>
              <a onClick={() => setActiveSection("about")}>About Us</a>
            </li>
            <li>
              <a onClick={() => setActiveSection("contact")}>Contact Us</a>
            </li>
          </ul>

          {activeSection && (
            <div className="footer-info-box">
              <h5>{activeSection.toUpperCase()}</h5>
              {renderActiveSection()}
              <button
                className="close-info-btn"
                onClick={() => setActiveSection(null)}
              >
                Close
              </button>
            </div>
          )}
        </div>

        <div className="footer-faq-section">
          <h4>FAQs</h4>
          <button onClick={handleDownloadPdf}>Download FAQs</button>
          <div className="faq-list">
            {faqs.map((faq) => (
              <div key={faq._id} className="faq-item">
                <div
                  className="faq-question"
                  onClick={() => toggleFaq(faq._id)}
                >
                  {faq.question}
                  {expandedId === faq._id ? <FaChevronUp /> : <FaChevronDown />}
                </div>
                {expandedId === faq._id && (
                  <div className="faq-answer">{faq.answer}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="footer-social">
        <h4>Connect With Us</h4>
        <div className="footer-social-icon">
          <a
            href={socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="footer-icon-container">
              <img src={instagram_icon} alt="Instagram" />
            </div>
          </a>
          <a
            href={socialLinks.facebook}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="footer-icon-container">
              <img src={facebook_icon} alt="Facebook" />
            </div>
          </a>
          <a
            href={socialLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="footer-icon-container">
              <img src={Whatsapp_icon} alt="WhatsApp" />
            </div>
          </a>
        </div>
      </div>

      <div className="footer-copyright">
        <hr />
        <p>
          Copyright © {new Date().getFullYear()} GadgetStore. All rights
          reserved.
        </p>
      </div>
    </div>
  );
};

export default Footer;
