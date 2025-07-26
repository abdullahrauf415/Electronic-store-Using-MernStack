import React, { useState, useEffect, useContext } from "react";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSave,
  FaTimes,
  FaChevronDown,
} from "react-icons/fa";
import HomeContext from "../../Context/HomeContext";
import axios from "axios";
import "./AdminQuickLinks.css";

const AdminQuickLinks = () => {
  const { user, isAdmin, logout } = useContext(HomeContext);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    icon: "",
  });
  const [isAdding, setIsAdding] = useState(false);
  const [selectedLink, setSelectedLink] = useState("");

  useEffect(() => {
    if (isAdmin) {
      fetchQuickLinks();
    }
  }, [isAdmin]);

  const fetchQuickLinks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:3000/quick-links", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (response.data.success) {
        setLinks(response.data.links);
        setError(null);
      } else {
        setError("Failed to fetch quick links");
      }
    } catch (err) {
      console.error("Error fetching quick links:", err);
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

  const handleSelectChange = (e) => {
    const id = e.target.value;
    if (id === "new") {
      handleAddClick();
    } else if (id) {
      const link = links.find((link) => link._id === id);
      if (link) {
        handleEditClick(link);
      }
    } else {
      handleCancelEdit();
    }
  };

  const handleEditClick = (link) => {
    setEditingId(link._id);
    setSelectedLink(link._id);
    setFormData({
      title: link.title,
      content: link.content,
      icon: link.icon || "",
    });
    setIsAdding(false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedLink("");
    setFormData({
      title: "",
      content: "",
      icon: "",
    });
  };

  const handleAddClick = () => {
    setIsAdding(true);
    setEditingId(null);
    setSelectedLink("new");
    setFormData({
      title: "",
      content: "",
      icon: "",
    });
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setSelectedLink("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        // Update existing link
        const response = await axios.put(
          `http://localhost:3000/quick-links/${editingId}`,
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
          setSelectedLink("");
          handleCancelEdit();
        }
      } else if (isAdding) {
        // Add new link
        const response = await axios.post(
          "http://localhost:3000/quick-links",
          formData,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );

        if (response.data.success) {
          setLinks([...links, response.data.link]);
          setSelectedLink("");
          handleCancelAdd();
        }
      }
    } catch (err) {
      console.error("Error saving quick link:", err);
      setError(err.response?.data?.message || "Failed to save link");

      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this quick link?"))
      return;

    try {
      const response = await axios.delete(
        `http://localhost:3000/quick-links/${id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (response.data.success) {
        setLinks(links.filter((link) => link._id !== id));
        // If we're deleting the currently edited link, reset the form
        if (editingId === id) {
          handleCancelEdit();
        }
      }
    } catch (err) {
      console.error("Error deleting quick link:", err);
      setError(err.response?.data?.message || "Failed to delete link");

      if (err.response?.status === 401) {
        logout();
      }
    }
  };

  if (!isAdmin) {
    return (
      <div className="admin-quicklinks">
        <div className="admin-restricted">
          <h2>Admin Access Required</h2>
          <p>You must be an administrator to access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="admin-quicklinks">
        <div className="loading-spinner"></div>
        <p>Loading quick links...</p>
      </div>
    );
  }

  return (
    <div className="admin-quicklinks">
      <div className="header">
        <h2>Quick Links Management</h2>
        <button
          className="add-btn"
          onClick={handleAddClick}
          disabled={isAdding}
        >
          <FaPlus /> Add New Link
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="link-selector">
        <label>Select Quick Link to Edit:</label>
        <div className="custom-select">
          <select value={selectedLink} onChange={handleSelectChange}>
            <option value="">-- Select a link --</option>
            <option value="new">+ Create New Link</option>
            {links.map((link) => (
              <option key={link._id} value={link._id}>
                {link.title}
              </option>
            ))}
          </select>
          <FaChevronDown className="select-arrow" />
        </div>
      </div>

      {(isAdding || editingId) && (
        <div className="form-container">
          <h3>{editingId ? "Edit Quick Link" : "Add New Quick Link"}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter title"
                required
              />
            </div>

            <div className="form-group">
              <label>Content:</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Enter content to show in popup"
                rows="5"
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
                placeholder="Icon class (e.g., 'fas fa-link')"
              />
              <small>Use Font Awesome classes or emoji</small>
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
          <p>No quick links added yet.</p>
          <button className="add-btn" onClick={handleAddClick}>
            <FaPlus /> Add Your First Link
          </button>
        </div>
      ) : (
        <div className="links-container">
          <h3>All Quick Links</h3>
          <p className="subtitle">Click on a link to edit or delete it</p>

          <div className="links-grid">
            {links.map((link) => (
              <div
                key={link._id}
                className={`link-card ${
                  editingId === link._id ? "editing" : ""
                }`}
                onClick={() => handleEditClick(link)}
              >
                <div className="link-icon">
                  {link.icon ? (
                    typeof link.icon === "string" &&
                    link.icon.startsWith("fa") ? (
                      <i className={link.icon}></i>
                    ) : (
                      <span className="icon-emoji">{link.icon}</span>
                    )
                  ) : (
                    <div className="default-icon">🔗</div>
                  )}
                </div>

                <div className="link-info">
                  <div className="title">{link.title}</div>
                  <div className="content-preview">
                    {link.content.substring(0, 100)}...
                  </div>
                </div>

                <div className="link-actions">
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClick(link);
                    }}
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(link._id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuickLinks;
