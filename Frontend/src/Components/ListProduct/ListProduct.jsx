import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ListProduct.css";
import { FaTrash, FaSearch, FaEdit, FaTimes } from "react-icons/fa";

const ListProduct = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [updatedProduct, setUpdatedProduct] = useState({});
  const [newImages, setNewImages] = useState([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to view products.");
      return;
    }
    try {
      const res = await axios.get("http://localhost:3000/allproducts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Normalize data for legacy products without size array
      const normalizedProducts = res.data.map((product) => ({
        ...product,
        size: product.size || [
          {
            size: "Default",
            new_price: product.new_price,
            old_price: product.old_price,
          },
        ],
      }));
      setProducts(normalizedProducts);
      setFilteredProducts(normalizedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products);
    } else {
      handleSearch();
    }
  }, [searchTerm, products]);

  const handleSearch = () => {
    const filtered = products.filter(
      (product) =>
        (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.description || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (product.category || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  const removeProduct = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to delete products.");
      return;
    }
    try {
      await axios.post(
        "http://localhost:3000/removeproduct",
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts((prev) => prev.filter((product) => product.id !== id));
      setFilteredProducts((prev) =>
        prev.filter((product) => product.id !== id)
      );
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Failed to delete product");
    }
  };

  const startEdit = (product) => {
    setEditingProduct(product);
    setUpdatedProduct({
      ...product,
      size: product.size || [],
      color: product.color?.join(", ") || "",
      image: product.image || [],
    });
    setNewImages([]);
  };

  const handleEditChange = (e) => {
    setUpdatedProduct({
      ...updatedProduct,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = async (e) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to upload images.");
      return;
    }
    const files = Array.from(e.target.files);
    const urls = [];
    for (let file of files) {
      const formData = new FormData();
      formData.append("product", file);
      try {
        const response = await axios.post(
          "http://localhost:3000/upload",
          formData,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        urls.push(response.data.image_url);
      } catch (err) {
        console.error("Image upload failed", err);
      }
    }
    setNewImages((prev) => [...prev, ...urls]);
  };

  const removeImage = (index, isNew = false) => {
    if (isNew) {
      setNewImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setUpdatedProduct((prev) => ({
        ...prev,
        image: prev.image.filter((_, i) => i !== index),
      }));
    }
  };

  const submitEdit = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to update products.");
      return;
    }
    try {
      const payload = {
        id: updatedProduct.id,
        name: updatedProduct.name,
        description: updatedProduct.description,
        category: updatedProduct.category,
        image: [...(updatedProduct.image || []), ...newImages],
        size: (updatedProduct.size || []).map((size) => ({
          size: size.size,
          new_price: Number(size.new_price),
          old_price: Number(size.old_price),
        })),
        color: updatedProduct.color?.split(",").map((c) => c.trim()) || [],
      };

      await axios.post("http://localhost:3000/updateproduct", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducts();
      setEditingProduct(null);
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Failed to update product. Check console for details.");
    }
  };

  const toggleAvailability = async (productId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to update availability.");
      return;
    }
    try {
      const response = await axios.put(
        `http://localhost:3000/toggle-availability/${productId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setProducts((prevProducts) =>
          prevProducts.map((products) =>
            products.id === productId
              ? { ...products, available: response.data.available }
              : products
          )
        );
        setFilteredProducts((prev) =>
          prev.map((products) =>
            products.id === productId
              ? { ...products, available: response.data.available }
              : products
          )
        );
      }
    } catch (err) {
      console.error("Error toggling availability:", err);
      alert("Failed to update availability");
    }
  };

  return (
    <div className="list-product-container">
      <div className="header-section">
        <h1 className="page-title">Product Inventory</h1>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
          />
          <button className="search-button" onClick={handleSearch}>
            <FaSearch className="search-icon" />
          </button>
        </div>
      </div>

      <div className="product-grid">
        {filteredProducts.map((product) => (
          <div className="product-card" key={product.id}>
            <div className="image-carousel">
              {product.image?.map((img, index) => (
                <img key={index} src={img} alt={`${product.name}-${index}`} />
              ))}
            </div>
            <div className="product-info">
              <h3 className="product-name">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <div className="price-section">
                {product.size?.[0]?.new_price ? (
                  <span className="current-price">
                    RS.{product.size[0].new_price}
                  </span>
                ) : (
                  <span className="current-price na">Price N/A</span>
                )}
                {product.size?.[0]?.old_price && (
                  <span className="original-price">
                    RS.{product.size[0].old_price}
                  </span>
                )}
              </div>
              <div className="details-section">
                {product.size?.length > 0 && (
                  <div className="size-variants">
                    {product.size.map((size, index) => (
                      <span key={index} className="size-pill">
                        {size.size} - RS.{size.new_price}
                      </span>
                    ))}
                  </div>
                )}
                {product.color?.length > 0 && (
                  <div className="color-chips">
                    {product.color.map((color, index) => (
                      <span
                        key={index}
                        className="color-chip"
                        style={{ backgroundColor: color.toLowerCase() }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="action-buttons">
                <button
                  className={`availability-button ${
                    !product.available ? "out-of-stock" : ""
                  }`}
                  onClick={() => toggleAvailability(product.id)}
                >
                  {product.available ? "Mark Out of Stock" : "Mark In Stock"}
                </button>
                <button
                  className="edit-button"
                  onClick={() => startEdit(product)}
                >
                  <FaEdit /> Edit
                </button>
                <button
                  className="delete-button"
                  onClick={() => removeProduct(product.id)}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingProduct && (
        <div className="edit-modal-overlay">
          <div className="edit-modal">
            <div className="modal-header">
              <h2>Edit Product</h2>
              <button
                className="close-button"
                onClick={() => setEditingProduct(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name</label>
                  <input
                    type="text"
                    name="name"
                    value={updatedProduct.name}
                    onChange={handleEditChange}
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <input
                    type="text"
                    name="category"
                    value={updatedProduct.category}
                    onChange={handleEditChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={updatedProduct.description}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group">
                <label>size & Pricing</label>
                {updatedProduct.size?.map((size, index) => (
                  <div key={index} className="size-input-group">
                    <input
                      type="text"
                      placeholder="Size"
                      value={size.size}
                      onChange={(e) => {
                        const newSize = [...updatedProduct.size];
                        newSize[index].size = e.target.value;
                        setUpdatedProduct({
                          ...updatedProduct,
                          size: newSize,
                        });
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Current Price"
                      value={size.new_price}
                      onChange={(e) => {
                        const newSize = [...updatedProduct.size];
                        newSize[index].new_price = e.target.value;
                        setUpdatedProduct({
                          ...updatedProduct,
                          size: newSize,
                        });
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Original Price"
                      value={size.old_price}
                      onChange={(e) => {
                        const newSize = [...updatedProduct.size];
                        newSize[index].old_price = e.target.value;
                        setUpdatedProduct({
                          ...updatedProduct,
                          size: newSize,
                        });
                      }}
                    />
                    <button
                      className="remove-size"
                      onClick={() => {
                        const newSize = updatedProduct.size.filter(
                          (_, i) => i !== index
                        );
                        setUpdatedProduct({
                          ...updatedProduct,
                          size: newSize,
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  className="add-size"
                  onClick={() => {
                    setUpdatedProduct({
                      ...updatedProduct,
                      size: [
                        ...updatedProduct.size,
                        { size: "", new_price: "", old_price: "" },
                      ],
                    });
                  }}
                >
                  + Add Size
                </button>
              </div>
              <div className="form-group">
                <label>Colors (comma separated)</label>
                <input
                  type="text"
                  name="color"
                  value={updatedProduct.color}
                  onChange={handleEditChange}
                />
              </div>
              <div className="form-group">
                <label>Product Images</label>
                <div className="image-upload-container">
                  <input
                    type="file"
                    multiple
                    onChange={handleImageUpload}
                    id="edit-image-upload"
                  />
                  <label htmlFor="edit-image-upload" className="upload-label">
                    Add New Images
                  </label>
                  <div className="image-previews">
                    {updatedProduct.image?.map((img, index) => (
                      <div key={`existing-${index}`} className="image-preview">
                        <img src={img} alt={`Existing-${index}`} />
                        <button
                          onClick={() => removeImage(index, false)}
                          className="remove-image-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {newImages.map((img, index) => (
                      <div key={`new-${index}`} className="image-preview">
                        <img src={img} alt={`New-${index}`} />
                        <button
                          onClick={() => removeImage(index, true)}
                          className="remove-image-btn"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <button className="submit-button" onClick={submitEdit}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProduct;
