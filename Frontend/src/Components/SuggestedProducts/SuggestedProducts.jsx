import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import "./SuggestedProducts.css";
import Item from "../Item/Item";
import HomeContext from "../../Context/HomeContext";

const SuggestedProducts = () => {
  const { user, cartItems, products } = useContext(HomeContext);
  const [suggested, setSuggested] = useState([]);

  // Extract cart and order categories
  const extractCategories = (items) => {
    const categories = [];

    for (const key in items) {
      const item = items[key];
      const product = products.find((p) => p.id === item.id);
      if (product?.category) categories.push(product.category);
    }

    return categories;
  };

  // Fetch orders (only if user is logged in)
  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:3000/user-orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orders = res.data.orders || [];
      const categories = [];

      orders.forEach((order) => {
        order.items.forEach((itemName) => {
          const foundProduct = products.find((p) => p.name === itemName);
          if (foundProduct?.category) categories.push(foundProduct.category);
        });
      });

      return categories;
    } catch (err) {
      console.error("Suggestion fetch failed:", err);
      return [];
    }
  };

  const fetchSuggestions = async () => {
    if (!products || products.length === 0) return;

    let categories = extractCategories(cartItems);

    if (user) {
      const orderCats = await fetchUserOrders();
      categories = [...categories, ...orderCats];
    }

    // Count category frequency
    const catCount = {};
    categories.forEach((cat) => {
      catCount[cat] = (catCount[cat] || 0) + 1;
    });

    let topCategories = Object.keys(catCount).sort(
      (a, b) => catCount[b] - catCount[a]
    );

    // If no history (new user), show 2 from each category
    if (topCategories.length === 0) {
      const uniqueCats = [...new Set(products.map((p) => p.category))];
      const initialSuggestions = uniqueCats.flatMap((cat) =>
        products.filter((p) => p.category === cat).slice(0, 2)
      );
      setSuggested(initialSuggestions);
      return;
    }

    // Logged-in with history: Show top 3 categories (max 3–5)
    topCategories = topCategories.slice(0, 3);

    const finalSuggestions = topCategories.flatMap((cat) =>
      products.filter((p) => p.category === cat).slice(0, 4)
    );

    setSuggested(finalSuggestions);
  };

  useEffect(() => {
    fetchSuggestions();
  }, [products, user]);

  return (
    <div className="suggested-products">
      <h2>You May Like</h2>
      <hr />
      <div className="suggested-products-grid">
        {suggested.map((item) => {
          const size = item.size?.[0] || {};
          return (
            <Item
              key={item.id}
              id={item.id}
              name={item.name}
              image={item.image?.[0] || ""}
              new_price={size.new_price}
              old_price={size.old_price}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedProducts;
