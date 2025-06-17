import React from "react";
import { useEffect } from "react";
import "./Item.css";
import { Link } from "react-router-dom";

const Item = ({ id, name, image, new_price, old_price }) => {
  const discountPercentage =
    old_price && new_price
      ? Math.round(((old_price - new_price) / old_price) * 100)
      : 0;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Link to={`/product/${id}`} className="item-link">
      <div className="item">
        {discountPercentage > 0 && (
          <div className="item-discount">{discountPercentage}% OFF</div>
        )}
        <img
          src={Array.isArray(image) ? image[0] : image}
          alt={name}
          loading="lazy"
          className="item-image"
        />
        <p className="item-name">{name}</p>
        <div className="item-price">
          <div className="item-price-new">Rs. {new_price}</div>
          <div className="item-price-old">Rs. {old_price}</div>
        </div>
      </div>
    </Link>
  );
};

export default Item;
