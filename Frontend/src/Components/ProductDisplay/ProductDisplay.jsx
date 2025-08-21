import React, { useContext, useState, useEffect } from "react";
import "./ProductDisplay.css";
import HomeContext from "../../Context/HomeContext";

const ProductDisplay = ({ product }) => {
  const { addToCart, isAdmin } = useContext(HomeContext);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [mainImage, setMainImage] = useState(product.image?.[0] || "");
  const [error, setError] = useState("");
  const [price, setPrice] = useState({
    new_price: product.new_price || 0,
    old_price: product.old_price || 0,
  });

  useEffect(() => {
    if (product.size?.length) {
      const first = product.size[0];
      setSelectedSize(first.size || first);
      setPrice({
        new_price: first.new_price,
        old_price: first.old_price,
      });
    } else {
      setPrice({
        new_price: product.new_price,
        old_price: product.old_price,
      });
    }

    setMainImage(product.image?.[0] || "");
    setSelectedColor("");
    setError("");
  }, [product]);

  const handleImageClick = (imgUrl) => {
    if (imgUrl !== mainImage) {
      setMainImage(imgUrl);
      const imageElement = document.querySelector(".main-image");
      if (imageElement) {
        imageElement.classList.remove("animate");
        void imageElement.offsetWidth;
        imageElement.classList.add("animate");
      }
    }
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size.size || size);
    setPrice({
      new_price: size.new_price || product.new_price,
      old_price: size.old_price || product.old_price,
    });
  };

  const handleAddToCart = () => {
    if (isAdmin) return; // Prevent adding to cart if admin

    const errors = [];

    if (product.size?.length && !selectedSize) {
      errors.push("Please select a size");
    }
    if (product.color?.length && !selectedColor) {
      errors.push("Please select a color");
    }

    if (errors.length) {
      setError(errors.join(" and "));
      return;
    }

    setError("");
    addToCart(product.id, selectedSize, selectedColor);
  };

  const discountPercentage =
    price.old_price && price.new_price
      ? Math.round(
          ((price.old_price - price.new_price) / price.old_price) * 100
        )
      : 0;

  // Check if admin is logged in
  const isAdminMode = isAdmin;
  const buttonDisabled = !product.available || isAdminMode;

  return (
    <div className="product-display">
      <div className="product-display-left">
        <div className="product-display-main-img">
          <img src={mainImage} alt={product.name} className="main-image" />

          {discountPercentage > 0 && (
            <div className="discount-badge">
              <span>{discountPercentage}% OFF</span>
            </div>
          )}

          {!product.available && (
            <div className="out-of-stock-overlay">Out of Stock</div>
          )}
        </div>

        <div className="product-display-img-list">
          {product.image?.map((img, i) => (
            <div
              key={i}
              className={`thumbnail-container ${
                mainImage === img ? "active-thumb" : ""
              }`}
              onClick={() => handleImageClick(img)}
            >
              <img src={img} alt={`${product.name} ${i + 1}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="product-display-right">
        <div className="product-header">
          <h1>{product.name}</h1>
          <div className="price-container">
            <div className="new-price">
              Rs. {price.new_price.toLocaleString()}
            </div>
            {price.old_price > price.new_price && (
              <div className="old-price">
                Rs. {price.old_price.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        <div className="product-options-container">
          {product.size?.length > 0 && (
            <div className="product-option">
              <h2>Select Size</h2>
              <div className="size-options">
                {product.size.map((size, index) => {
                  const label = size.size || size;
                  return (
                    <button
                      key={index}
                      className={`size-option ${
                        selectedSize === label ? "active" : ""
                      }`}
                      onClick={() => handleSizeSelect(size)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {product.color?.length > 0 && (
            <div className="product-option">
              <h2>Select Color</h2>
              <div className="color-options">
                {product.color.map((color) => (
                  <div
                    key={color}
                    className={`color-option ${
                      selectedColor === color ? "active" : ""
                    }`}
                    onClick={() => setSelectedColor(color)}
                    title={color}
                  >
                    <div
                      className="color-swatch"
                      style={{ backgroundColor: color.toLowerCase() }}
                    />
                    <span className="color-label">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          onClick={handleAddToCart}
          className={`add-to-cart ${buttonDisabled ? "disabled" : ""}`}
          disabled={buttonDisabled}
        >
          {isAdminMode
            ? "You are admin"
            : !product.available
            ? "OUT OF STOCK"
            : "ADD TO CART"}
          {!isAdminMode && product.available && (
            <span className="cart-icon">🛒</span>
          )}
        </button>
      </div>
    </div>
  );
};

export default ProductDisplay;
