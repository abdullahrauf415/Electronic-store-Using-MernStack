import React, { useContext, useState, useEffect } from "react";
import "./ProductDisplay.css";
import HomeContext from "../../Context/HomeContext";

const ProductDisplay = ({ product }) => {
  const { addToCart } = useContext(HomeContext);

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
  const disconutPercentage =
    price.old_price && price.new_price
      ? Math.round(
          ((price.old_price - price.new_price) / price.old_price) * 100
        )
      : 0;

  return (
    <div className="product-display">
      <div className="product-display-left">
        <div className="product-display-img-list">
          {product.image?.map((img, i) => (
            <img
              key={i}
              src={img}
              alt={`${product.name} ${i + 1}`}
              onClick={() => handleImageClick(img)}
              className={mainImage === img ? "active-thumb" : ""}
            />
          ))}
        </div>
        <div className="product-display-main-img">
          <img src={mainImage} alt={product.name} className="main-image" />
        </div>
      </div>

      <div className="product-display-right">
        <h1>{product.name}</h1>

        <div className="product-display-prices">
          <div className="new-price">Rs. {price.new_price}</div>
          <div className="old-price">Rs. {price.old_price}</div>
          <div className="product-display-discount">
            {disconutPercentage > 0 && (
              <div className="item-discount">{disconutPercentage}% OFF</div>
            )}
          </div>
          {!product.available && (
            <div className="out-of-stock-badge">Out of Stock</div>
          )}
        </div>

        {product.size?.length > 0 && (
          <div className="product-options">
            <h2>Select Size</h2>
            <div className="size-options">
              {product.size.map((size, index) => {
                const label = size.size || size;
                return (
                  <button
                    key={index}
                    className={selectedSize === label ? "active" : ""}
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
          <div className="product-options">
            <h2>Select Color</h2>
            <div className="color-options">
              {product.color.map((color) => (
                <button
                  key={color}
                  className={selectedColor === color ? "active" : ""}
                  onClick={() => setSelectedColor(color)}
                  style={{
                    backgroundColor: color.toLowerCase(),
                    border:
                      selectedColor === color ? "2px solid black" : "none",
                  }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        <button
          onClick={handleAddToCart}
          className={`add-to-cart ${!product.available ? "disabled" : ""}`}
          disabled={!product.available}
        >
          {product.available ? "ADD TO CART" : "OUT OF STOCK"}
        </button>
      </div>
    </div>
  );
};

export default ProductDisplay;
