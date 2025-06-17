import React, { useState } from "react";
import axios from "axios";
import "./AddProduct.css";

const AddProduct = () => {
  const initialFormState = {
    name: "",
    description: "",
    category: "",
    size: [{ size: "", new_price: "", old_price: "" }],
    color: "",
  };

  const [productData, setProductData] = useState(initialFormState);
  const [imageURLs, setImageURLs] = useState([]);
  const categories = ["Electronics", "Gadgets", "Accessories"];

  const handleInputChange = (e) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };

  const handleSizeChange = (index, field, value) => {
    const newsize = [...productData.size];
    newsize[index][field] = value;
    setProductData({ ...productData, size: newsize });
  };

  const addSizeField = () => {
    setProductData({
      ...productData,
      size: [...productData.size, { size: "", new_price: "", old_price: "" }],
    });
  };

  const removeSizeField = (index) => {
    const newsize = productData.size.filter((_, i) => i !== index);
    setProductData({ ...productData, size: newsize });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const urls = [];
    for (let file of files) {
      const formData = new FormData();
      formData.append("product", file);
      try {
        const response = await axios.post(
          "http://localhost:3000/upload",
          formData
        );
        urls.push(response.data.image_url);
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }
    setImageURLs((prev) => [...prev, ...urls]);
  };

  const removeImage = (indexToRemove) => {
    setImageURLs((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...productData,
      size: productData.size.map((size) => ({
        ...size,
        new_price: Number(size.new_price),
        old_price: Number(size.old_price),
      })),
      color: productData.color
        ? productData.color.split(",").map((c) => c.trim())
        : [],
      image: imageURLs,
    };

    try {
      const token = localStorage.getItem("token"); // Get token from localStorage
      if (!token) {
        alert("You must be logged in as admin to add a product.");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`, // Attach token to header
        },
      };

      const res = await axios.post(
        "http://localhost:3000/add-product",
        payload,
        config
      );
      alert(res.data.message || "Product added successfully!");
      setProductData(initialFormState);
      setImageURLs([]);
    } catch (error) {
      console.error("Failed to add product", error);
      alert(
        error.response?.data?.message ||
          "Failed to add product. Please try again."
      );
    }
  };

  return (
    <div className="add-product-container">
      <h2 className="form-title">Add New Product</h2>
      <form onSubmit={handleSubmit} className="product-form">
        <div className="form-grid">
          {/* Name and Description */}
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              name="name"
              value={productData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group full-width">
            <label>Description *</label>
            <textarea
              name="description"
              value={productData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label>Category *</label>
            <select
              name="category"
              value={productData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div className="form-group full-width">
            <label>Size & Pricing *</label>
            {productData.size.map((size, index) => (
              <div key={index} className="size-input-group">
                <input
                  type="text"
                  placeholder="Size (e.g., S, M, L)"
                  value={size.size}
                  onChange={(e) =>
                    handleSizeChange(index, "size", e.target.value)
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Current Price"
                  value={size.new_price}
                  onChange={(e) =>
                    handleSizeChange(index, "new_price", e.target.value)
                  }
                  required
                />
                <input
                  type="number"
                  placeholder="Original Price"
                  value={size.old_price}
                  onChange={(e) =>
                    handleSizeChange(index, "old_price", e.target.value)
                  }
                  required
                />
                {productData.size.length > 1 && (
                  <button
                    type="button"
                    className="remove-size"
                    onClick={() => removeSizeField(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="add-size" onClick={addSizeField}>
              + Add Size
            </button>
          </div>

          {/* Colors */}
          <div className="form-group">
            <label>Colors (comma separated)</label>
            <input
              type="text"
              name="color"
              value={productData.color}
              onChange={handleInputChange}
            />
          </div>

          {/* Image Upload */}
          <div className="form-group full-width">
            <label>Product Images</label>
            <div className="image-upload-container">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                id="image-upload"
              />
              <label htmlFor="image-upload" className="upload-label">
                <div className="upload-content">
                  <span className="upload-icon">📷</span>
                  <p>Drag & drop images or click to upload</p>
                  <small>PNG, JPG up to 5MB</small>
                </div>
              </label>

              {imageURLs.length > 0 && (
                <div className="image-previews">
                  {imageURLs.map((url, index) => (
                    <div key={index} className="image-preview">
                      <img src={url} alt={`preview-${index}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeImage(index)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="submit-btn">
          Publish Product
        </button>
      </form>
    </div>
  );
};

export default AddProduct;
