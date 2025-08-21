import React, { useState, useEffect, useContext } from "react";
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes } from "react-icons/fa";
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaPinterest,
  FaWhatsapp,
} from "react-icons/fa";

import HomeContext from "../../Context/HomeContext";
import axios from "axios";
import "./AdminSocialMedia.css";

const platformIcons = {
  facebook: <FaFacebook />,
  twitter: <FaTwitter />,
  instagram: <FaInstagram />,
  linkedin: <FaLinkedin />,
  youtube: <FaYoutube />,
  pinterest: <FaPinterest />,
  whatsapp: <FaWhatsapp />,
  other: <FaPlus />,
};

const AdminSocialMedia = () => {
  const { user, isAdmin, logout } = useContext(HomeContext);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    platform: "facebook",
    url: "",
    icon: "",
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchSocialMediaLinks();
    }
  }, [isAdmin]);

  const fetchSocialMediaLinks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        "http://localhost:3000/social-media-links",
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data.success) {
        setLinks(response.data.links);
        setError(null);
      } else {
        setError("Failed to fetch social media links");
      }
    } catch (err) {
      console.error("Error fetching social media links:", err);
      setError(err.response?.data?.message || "Failed to fetch links");

      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEditClick = (link) => {
    setEditingId(link._id);
    setFormData({
      platform: link.platform,
      url: link.url,
      icon: link.icon || "",
    });
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      platform: "facebook",
      url: "",
      icon: "",
    });
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setFormData({
      platform: "facebook",
      url: "",
      icon: "",
    });
    setEditingId(null);
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update existing link
        const response = await axios.put(
          `http://localhost:3000/social-media-links/${editingId}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (response.data.success) {
          setLinks(
            links.map((link) =>
              link._id === editingId ? response.data.link : link
            )
          );
          handleCancelEdit();
        }
      } else if (isAdding) {
        // Add new link
        const response = await axios.post(
          "http://localhost:3000/social-media-links",
          formData,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (response.data.success) {
          setLinks([...links, response.data.link]);
          handleCancelAdd();
        }
      }
    } catch (err) {
      console.error("Error saving social media link:", err);
      setError(err.response?.data?.message || "Failed to save link");

      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this link?")) return;

    try {
      const response = await axios.delete(
        `http://localhost:3000/social-media-links/${id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data.success) {
        setLinks(links.filter((link) => link._id !== id));
      }
    } catch (err) {
      console.error("Error deleting social media link:", err);
      setError(err.response?.data?.message || "Failed to delete link");

      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-social-media">
        <div className="admin-restricted">
          <h2>Admin Access Required</h2>
          <p>You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-social-media">
        <div className="loading-spinner"></div>
        <p>Loading social media links...</p>
      </div>
    );
  }

  return (
    <div className="admin-social-media">
      <div className="header">
        <h2>Social Media Links</h2>
        <button
          className="add-btn"
          onClick={handleAddClick}
          disabled={isAdding}
        >
          <FaPlus /> Add New Link
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {(isAdding || editingId) && (
        <div className="form-container">
          <h3>{editingId ? "Edit Link" : "Add New Link"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Platform:</label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
              >
                <option value="facebook">Facebook</option>
                <option value="twitter">Twitter</option>
                <option value="instagram">Instagram</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
                <option value="pinterest">Pinterest</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label>URL:</label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Icon (optional):</label>
              <input
                type="text"
                name="icon"
                value={formData.icon}
                onChange={handleInputChange}
                placeholder="Font Awesome class (e.g., 'fab fa-custom')"
              />
              <small>Leave blank to use default icon</small>
            </div>

            <div className="form-actions">
              <button type="submit" className="save-btn">
                <FaSave /> {editingId ? "Update" : "Add"} Link
              </button>
              <button
                type="button"
                className="cancel-btn"
                onClick={editingId ? handleCancelEdit : handleCancelAdd}
              >
                <FaTimes /> Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {links.length === 0 ? (
        <div className="no-links">
          <p>No social media links added yet.</p>
          <button className="add-btn" onClick={handleAddClick}>
            <FaPlus /> Add Your First Link
          </button>
        </div>
      ) : (
        <div className="links-container">
          {links.map((link) => (
            <div
              key={link._id}
              className={`link-card ${editingId === link._id ? "editing" : ""}`}
            >
              {editingId === link._id ? (
                <div className="editing-indicator">Editing...</div>
              ) : (
                <>
                  <div className="link-icon">
                    {link.icon ? (
                      <i className={link.icon}></i>
                    ) : (
                      platformIcons[link.platform] || platformIcons.other
                    )}
                  </div>

                  <div className="link-info">
                    <div className="platform">{link.platform}</div>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="url"
                    >
                      {link.url}
                    </a>
                  </div>

                  <div className="link-actions">
                    <button
                      className="edit-btn"
                      onClick={() => handleEditClick(link)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(link._id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSocialMedia;
