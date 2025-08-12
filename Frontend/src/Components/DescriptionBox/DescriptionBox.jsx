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

  const StarRating = ({ rating, max = 5 }) => {
    return (
      <div className="star-rating">
        {[...Array(max)].map((_, i) => (
          <span key={i} className={`star ${i < rating ? "filled" : ""}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="description-box">
      <div className="description-navigator">
        <button
          className={`description-nav-btn ${
            activeTab === "description" ? "active" : ""
          }`}
          onClick={() => setActiveTab("description")}
        >
          Description
        </button>
        <button
          className={`description-nav-btn ${
            activeTab === "reviews" ? "active" : ""
          }`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews <span className="review-count">({reviews.length})</span>
        </button>
      </div>

      <div className="description-content">
        {activeTab === "description" && (
          <div className="product-description">
            <div className="description-text">
              {description || "No description available."}
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="review-section">
            <div className="review-input-container">
              <h3 className="review-title">Share your experience</h3>
              {error && <div className="error-message">{error}</div>}

              <div className="rating-container">
                <p className="rating-label">Your rating:</p>
                <div className="star-selector">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      className={`star-btn ${
                        newReview.rating >= num ? "active" : ""
                      }`}
                      onClick={() => handleStarClick(num)}
                      type="button"
                      aria-label={`Rate ${num} stars`}
                      disabled={loading}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <span className="rating-value">
                  {newReview.rating > 0 ? `${newReview.rating}/5` : "Not rated"}
                </span>
              </div>

              <div className="review-input-group">
                <textarea
                  className="review-input"
                  placeholder="Share your thoughts about this product..."
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
            </div>

            <div className="review-list">
              <h3 className="review-list-title">Customer Reviews</h3>

              {Array.isArray(reviews) && reviews.length > 0 ? (
                reviews.map((review) => (
                  <div key={review._id} className="user-review">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {review.userName?.charAt(0) || "A"}
                        </div>
                        <div>
                          <strong className="reviewer-name">
                            {review.userName || "Anonymous"}
                          </strong>
                          <div className="review-rating">
                            <StarRating rating={review.rating} />
                            <span className="rating-text">
                              {review.rating}/5
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="review-date">
                        {review.date
                          ? new Date(review.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Unknown date"}
                      </span>
                    </div>

                    <p className="review-comment">{review.comment}</p>

                    {currentUserId && review.userId === currentUserId && (
                      <button
                        className="delete-review-btn"
                        onClick={() => handleDeleteReview(review._id)}
                        disabled={loading}
                        aria-label="Delete review"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        Delete
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="no-reviews">
                  <div className="no-reviews-icon">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28z" />
                    </svg>
                  </div>
                  <p>No reviews yet</p>
                  <p className="no-reviews-sub">
                    Be the first to share your experience!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

DescriptionBox.propTypes = {
  productId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    .isRequired,
  description: PropTypes.string,
};

export default DescriptionBox;
