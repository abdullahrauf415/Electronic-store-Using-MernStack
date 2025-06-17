import React, { useContext } from "react";
import "./RelatedProduct.css";
import Item from "../Item/Item";
import HomeContext from "../../Context/HomeContext";

const RelatedProduct = ({ category, currentProductId }) => {
  const { products } = useContext(HomeContext);

  // Filter same category and exclude current product
  const filteredProducts = products.filter(
    (p) => p.category === category && p.id !== currentProductId
  );

  // Shuffle the filtered products randomly
  const shuffled = filteredProducts
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

  // Pick the first 8 from shuffled
  const relatedProducts = shuffled.slice(0, 8);

  return (
    <div className="related-product">
      <h2>Related Products</h2>
      <hr />
      <div className="related-product-item">
        {relatedProducts.map((item) => {
          const firstSize = item.size?.[0] || {};
          return (
            <Item
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image[0]}
              new_price={firstSize.new_price}
              old_price={firstSize.old_price}
            />
          );
        })}
      </div>
    </div>
  );
};

export default RelatedProduct;
