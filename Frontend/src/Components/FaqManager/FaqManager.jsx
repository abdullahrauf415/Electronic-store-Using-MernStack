import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./FaqManager.css";

const FaqManager = () => {
  const [faqs, setFaqs] = useState([]);
  const [formData, setFormData] = useState({ question: "", answer: "" });
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchFaqs();
  }, []);

  const fetchFaqs = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/faqs", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && Array.isArray(response.data.faqs)) {
        setFaqs(response.data.faqs);
      } else {
        setError("Invalid FAQ data format");
        setFaqs([]);
      }

      setIsLoading(false);
    } catch {
      setError("Failed to load FAQs");
      setFaqs([]);
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      if (editingId) {
        await axios.put(`/api/update-faq/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("/api/add-faq", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      setFormData({ question: "", answer: "" });
      setEditingId(null);
      fetchFaqs();
    } catch {
      setError(editingId ? "Failed to update FAQ" : "Failed to add FAQ");
    }
  };

  const handleEdit = (faq) => {
    setFormData({ question: faq.question, answer: faq.answer });
    setEditingId(faq._id);
    setExpandedId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this FAQ?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`/api/delete-faq/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchFaqs();
      } catch {
        setError("Failed to delete FAQ");
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleAll = () => {
    setExpandedId(expandedId === "all" ? null : "all");
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
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

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

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

  return (
    <div className="faq-manager">
      <h2 className="manager-title">FAQ Manager</h2>

      <form onSubmit={handleSubmit} className="faq-form">
        <h3 className="form-title">{editingId ? "Edit FAQ" : "Add New FAQ"}</h3>

        <div className="form-group">
          <label className="input-label">Question</label>
          <input
            type="text"
            name="question"
            value={formData.question}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Enter question"
          />
        </div>

        <div className="form-group">
          <label className="input-label">Answer</label>
          <textarea
            name="answer"
            value={formData.answer}
            onChange={handleChange}
            required
            rows="4"
            className="textarea-field"
            placeholder="Enter detailed answer"
          />
        </div>

        <div className="form-actions">
          <button type="submit" className="submit-btn">
            {editingId ? "Update FAQ" : "Add FAQ"}
          </button>
          {editingId && (
            <button
              type="button"
              className="cancel-btn"
              onClick={() => {
                setFormData({ question: "", answer: "" });
                setEditingId(null);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <div className="error-message">{error}</div>}

      <div className="faq-list-container">
        <h3 className="list-title">Existing FAQs</h3>

        {faqs.length > 0 && (
          <>
            <input
              type="text"
              placeholder="Search questions..."
              className="faq-search-input"
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <button className="toggle-all-btn" onClick={toggleAll}>
              {expandedId === "all" ? "Collapse All" : "Expand All"}
            </button>
            <button
              className="toggle-all-btn"
              onClick={handleDownloadPdf}
              style={{ marginLeft: "10px" }}
            >
              Export to PDF
            </button>
          </>
        )}

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading FAQs...</p>
          </div>
        ) : faqs.length === 0 ? (
          <div className="empty-state">
            <p>No FAQs found. Add your first FAQ above!</p>
          </div>
        ) : (
          <div className="accordion-container" id="printable-faqs">
            {faqs
              .filter((faq) => faq.question.toLowerCase().includes(searchTerm))
              .map((faq) => (
                <div
                  key={faq._id}
                  className={`accordion-item ${
                    expandedId === faq._id || expandedId === "all"
                      ? "expanded"
                      : ""
                  }`}
                >
                  <div
                    className="accordion-header"
                    onClick={() => toggleExpand(faq._id)}
                  >
                    <div className="accordion-question">
                      <span className="question-text">{faq.question}</span>
                      <span className="expand-icon">
                        {expandedId === faq._id || expandedId === "all"
                          ? "▲"
                          : "▼"}
                      </span>
                    </div>
                  </div>

                  <div className="accordion-content">
                    <div className="answer-text">
                      <ReactMarkdown>{faq.answer}</ReactMarkdown>
                    </div>
                    <div className="accordion-actions">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(faq);
                        }}
                        className="edit-btn"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(faq._id);
                        }}
                        className="delete-btn"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FaqManager;
