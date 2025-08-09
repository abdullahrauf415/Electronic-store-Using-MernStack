import React, { useEffect, useState } from "react";
import "./NewArrival.css";
import Item from "../Item/Item";

const NewArrival = () => {
  const [new_arrivals, setNew_arrival] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/newArrivels")
      .then((response) => response.json())
      .then((data) => setNew_arrival(data));
  }, []);
  return (
    <div className="new-arrival">
      <h1>New Arrivals</h1>
      <div className="arrival">
        {new_arrivals.map((item, index) => {
          const firstSize = item.size?.[0] || {};
          return (
            <Item
              key={index}
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

export default NewArrival;
