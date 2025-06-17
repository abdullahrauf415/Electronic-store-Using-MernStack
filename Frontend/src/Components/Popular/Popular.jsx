import React, { useEffect } from "react";
import "./Popular.css";
import Item from "../Item/Item";

import { useState } from "react";
const Popular = () => {
  const [popular, set_popular] = useState([]);
  useEffect(() => {
    fetch("http://localhost:3000/popularitems")
      .then((response) => response.json())
      .then((data) => set_popular(data));
  }, []);

  return (
    <div className="popular">
      <h1>Popular in Home Appliances</h1>
      <hr />
      <div className="popular-item">
        {popular.map((item) => {
          const firstSize = item.size?.[0] || {};
          return (
            <Item
              key={item.id}
              // key={item.id} is used to give a unique key to each item in the list
              id={item.id}
              name={item.name}
              image={item.image}
              new_price={firstSize.new_price}
              old_price={firstSize.old_price}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Popular;
