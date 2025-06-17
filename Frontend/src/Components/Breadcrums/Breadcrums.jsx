import React from "react";
import "./Breadcrums.css";
import arrow_icon from "../Assets/breadcrum_arrow.png";
import { Link } from "react-router-dom";
const Breadcrums = (props) => {
  const { product } = props;
  return (
    <div className="breadcrums">
      <Link to="/">
        Home <img src={arrow_icon} alt="" />{" "}
      </Link>
      <Link to={`/${product.category}`}>
        {product.category} <img src={arrow_icon} alt="" />{" "}
      </Link>
      {product.name}
    </div>
  );
};

export default Breadcrums;
