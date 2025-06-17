import React, { useContext } from "react";
import { useParams } from "react-router-dom";
import HomeContext from "../Context/HomeContext";
import ProductDisplay from "../Components/ProductDisplay/ProductDisplay";
import DescriptionBox from "../Components/DescriptionBox/DescriptionBox";
import RelatedProduct from "../Components/RelatedProduct/RelatedProduct";

const Product = () => {
  const { products } = useContext(HomeContext);
  const { productId } = useParams();

  const product = products.find((item) => item.id === Number(productId));

  if (!product) return <div>Product not found.</div>;

  return (
    <div>
      <ProductDisplay product={product} />
      <DescriptionBox productId={product.id} />
      <RelatedProduct
        category={product.category}
        currentProductId={product.id}
      />
    </div>
  );
};

export default Product;
