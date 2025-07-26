import React, { useState, useEffect } from "react";
import "./Footer.css";
import {
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaDownload,
} from "react-icons/fa";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaPinterestP,
  FaWhatsapp,
} from "react-icons/fa";

const Footer = () => {
  const [faqs, setFaqs] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [activeQuickLink, setActiveQuickLink] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch FAQs
        const faqResponse = await fetch("/api/faqs");
        const faqData = await faqResponse.json();
        if (faqData.success) setFaqs(faqData.faqs);

        // Fetch social media links
        const socialResponse = await fetch(
          "http://localhost:3000/social-media-links"
        );
        const socialData = await socialResponse.json();
        if (socialData.success) setSocialLinks(socialData.links);

        // Fetch quick links
        const quickLinksResponse = await fetch(
          "http://localhost:3000/quick-links"
        );
        const quickLinksData = await quickLinksResponse.json();
        if (quickLinksData.success) setQuickLinks(quickLinksData.links);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const getSocialIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case "facebook":
        return <FaFacebookF />;
      case "instagram":
        return <FaInstagram />;
      case "twitter":
        return <FaTwitter />;
      case "linkedin":
        return <FaLinkedinIn />;
      case "youtube":
        return <FaYoutube />;
      case "pinterest":
        return <FaPinterestP />;
      case "whatsapp":
        return <FaWhatsapp />;
      default:
        return <div className="social-initial">{platform.charAt(0)}</div>;
    }
  };

  const openQuickLink = (link) => {
    setActiveQuickLink(link);
  };

  if (loading) {
    return (
      <footer className="footer">
        <div className="footer-loading">
          <div className="loading-spinner"></div>
          <p>Loading footer content...</p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <div className="footer-logo">
            <div className="logo-placeholder">GS</div>
            <div>
              <h2>GadgetStore</h2>
              <p className="footer-tagline">
                Your one-stop destination for the latest gadgets
              </p>
            </div>
          </div>
        </div>

        <div className="footer-links-grid">
          <div className="footer-links-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              {quickLinks.map((link) => (
                <li key={link._id}>
                  <a onClick={() => openQuickLink(link)}>{link.title}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer-faq-section">
            <h4>
              FAQs
              <button className="download-faq-btn" onClick={handleDownloadPdf}>
                <FaDownload /> PDF
              </button>
            </h4>
            <div className="faq-list">
              {faqs.map((faq) => (
                <div key={faq._id} className="faq-item">
                  <div className="faq-question always-open">{faq.question}</div>
                  <div className="faq-answer">{faq.answer}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="footer-social-section">
        <div className="footer-social">
          <h4>Connect With Us</h4>
          <div className="footer-social-icons">
            {socialLinks.map((link) => (
              <a
                key={link._id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                title={link.platform}
              >
                {getSocialIcon(link.platform)}
              </a>
            ))}
          </div>
        </div>

        <div className="footer-payment">
          <h4>Secure Payments</h4>
          <div className="payment-methods">
            <div className="payment-method">Visa</div>
            <div className="payment-method">MasterCard</div>
            <div className="payment-method">Cash on delivery</div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>© {new Date().getFullYear()} GadgetStore. All rights reserved.</p>
        </div>
      </div>

      {/* Quick Link Modal */}
      {activeQuickLink && (
        <div className="quicklink-modal">
          <div className="modal-content">
            <button
              className="close-modal"
              onClick={() => setActiveQuickLink(null)}
            >
              <FaTimes />
            </button>
            <h3>{activeQuickLink.title}</h3>
            <div className="modal-body">
              <p>{activeQuickLink.content}</p>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
