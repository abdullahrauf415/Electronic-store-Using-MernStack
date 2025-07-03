import React, { useState, useEffect } from "react";
import "./DescriptionBox.css";
import axios from "axios";
import PropTypes from "prop-types";
import { jwtDecode } from "jwt-decode";

const DescriptionBox = ({ productId, description }) => {
  const [activeTab, setActiveTab] = useState("description");
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ comment: "", rating: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Get current user ID from token
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setCurrentUserId(decoded.user.id);
      } catch (err) {
        console.error("Token decode error:", err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const parsedId = parseInt(productId, 10);
        if (isNaN(parsedId)) throw new Error("Invalid product ID");

        const response = await axios.get(
          `http://localhost:3000/product-reviews/${parsedId}`
        );
        setReviews(response.data.reviews || []);
        setError("");
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError(err.response?.data?.message || "Failed to load reviews");
        setReviews([]);
      }
    };

    activeTab === "reviews" && fetchReviews();
  }, [productId, activeTab]);

  const handleStarClick = (rating) => {
    setNewReview((prev) => ({ ...prev, rating }));
  };

  const handleReviewSubmit = async () => {
    try {
      const parsedId = parseInt(productId, 10);
      if (isNaN(parsedId)) throw new Error("Invalid product ID");
      if (!newReview.rating) throw new Error("Please select a rating");
      if (!newReview.comment.trim()) throw new Error("Please write a review");

      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login to submit a review");

      const response = await axios.post(
        "http://localhost:3000/submit-review",
        {
          productId: parsedId,
          comment: newReview.comment.trim(),
          rating: newReview.rating,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setReviews((prev) => [response.data.review, ...prev]);
      setNewReview({ comment: "", rating: 0 });
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please login to delete review");

      const response = await axios.delete(
        `http://localhost:3000/delete-review/${reviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setReviews((prev) => prev.filter((review) => review._id !== reviewId));
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    const validRating = Math.min(Math.max(rating, 0), 5);
    return "⭐".repeat(validRating) + "☆".repeat(5 - validRating);
  };

  return (
    <div className="description-box">
      <div className="description-navigator">
        <div
          className={`description-nav-box ${
            activeTab === "description" ? "active" : ""
          }`}
          onClick={() => setActiveTab("description")}
        >
          Description
        </div>
        <div
          className={`description-nav-box ${
            activeTab === "reviews" ? "active" : "fade"
          }`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews ({(Array.isArray(reviews) && reviews.length) || 0})
        </div>
      </div>

      <div className="descriptionbox-description">
        {activeTab === "description" && (
          <>
            <div className="product-display-description">
              {description || "No description available."}
            </div>
          </>
        )}

        {activeTab === "reviews" && (
          <div className="review-section">
            {error && <div className="error-message">{error}</div>}

            <div className="review-input-container">
              <div className="rating-selector">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    className={`star ${
                      newReview.rating >= num ? "active" : ""
                    }`}
                    onClick={() => handleStarClick(num)}
                    type="button"
                    aria-label={`Rate ${num} stars`}
                    disabled={loading}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <small className="rating-display">
                Selected rating: {newReview.rating || "None"}
              </small>

              <textarea
                className="review-input"
                placeholder="Write your review here..."
                value={newReview.comment}
                onChange={(e) =>
                  setNewReview({ ...newReview, comment: e.target.value })
                }
                disabled={loading}
              />

              <button
                className="submit-review-btn"
                onClick={handleReviewSubmit}
                disabled={
                  loading || !newReview.comment.trim() || !newReview.rating
                }
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </button>
            </div>

            <div className="review-list">
              {Array.isArray(reviews) && reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="user-review">
                    <div className="review-header">
                      <strong>{review.userName || "Anonymous"}</strong>
                      <span className="review-date">
                        {review.date
                          ? new Date(review.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })
                          : "Unknown date"}
                      </span>
                    </div>
                    <div className="review-rating">
                      {renderStars(review.rating)}
                      <span className="rating-text">({review.rating}/5)</span>

                      {/* Delete button for the review author */}
                      {currentUserId && review.userId === currentUserId && (
                        <button
                          className="delete-review-btn"
                          onClick={() => handleDeleteReview(review._id)}
                          disabled={loading}
                          aria-label="Delete review"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                    <p className="review-comment">{review.comment}</p>
                  </div>
                ))
              ) : (
                <div className="no-reviews">
                  No reviews yet. Be the first to share your experience!
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DescriptionBox;
