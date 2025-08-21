import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import HomeContext from "./HomeContext";

const HomeProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState({});
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme
      ? savedTheme === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("isAdmin");
    setUser(null);
    setIsAdmin(false);
    setCartItems({});
  }, []);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await axios.get("http://localhost:3000/verify-token", {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Log to ensure name is received
        console.log("Verified user data:", data);

        setUser({
          email: data.email,
          token,
          name: data.name || "", // ✅ Ensure name is set here
        });

        console.log("User verified and logged in:", {
          email: data.email,
          name: data.name,
        });

        setIsAdmin(data.isAdmin || false);

        // Fetch user's cart
        const cartRes = await axios.get("http://localhost:3000/get-cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCartItems(cartRes.data.cartData || {});
      } catch (error) {
        console.error("Auth verification failed:", error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [logout]);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      const token = localStorage.getItem("token");

      try {
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};
        const response = await axios.get(
          "http://localhost:3000/allproducts",
          config
        );
        setProducts(response.data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setProductsLoading(false);
      }
    };

    if (!loading) {
      fetchProducts();
    }
  }, [loading]);

  const syncCart = useCallback(
    async (cartData) => {
      if (!user?.token) return;

      try {
        await axios.post(
          "http://localhost:3000/update-cart",
          { cartData },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      } catch (error) {
        console.error("Cart sync failed:", error);
        if (error.response?.status === 401) logout();
      }
    },
    [user, logout]
  );

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (Object.keys(cartItems).length > 0) {
        const data = JSON.stringify(cartItems);
        navigator.sendBeacon(
          "http://localhost:3000/update-cart",
          new Blob([data], { type: "application/json" })
        );
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [cartItems]);

  const addToCart = (ItemId, size = "", color = "") => {
    const product = products.find((p) => p.id === ItemId);
    if (!product) return;

    const selectedSize =
      product.size.find((s) => s.size === size) || product.size[0];

    const key = `${ItemId}_${selectedSize.size}_${color || "default"}`;

    setCartItems((prev) => {
      const newCart = {
        ...prev,
        [key]: prev[key]
          ? {
              ...prev[key],
              quantity: prev[key].quantity + 1,
              price: selectedSize.new_price,
            }
          : {
              id: ItemId,
              quantity: 1,
              size: selectedSize.size,
              color,
              price: selectedSize.new_price,
            },
      };

      syncCart(newCart);
      return newCart;
    });
  };

  const removeFromCart = (key) => {
    setCartItems((prev) => {
      const newCart = { ...prev };
      if (newCart[key]?.quantity > 1) {
        newCart[key].quantity -= 1;
      } else {
        delete newCart[key];
      }
      syncCart(newCart);
      return newCart;
    });
  };

  // ✅ Fixed loginUser function with correct parameter order
  const loginUser = async (token, email, isAdminFlag = false, name = "") => {
    try {
      localStorage.setItem("token", token);
      localStorage.setItem("isAdmin", isAdminFlag ? "true" : "false");

      // Set user state with all required fields
      setUser({
        token,
        email: email || "",
        name: name || "",
      });

      setIsAdmin(isAdminFlag);

      console.log("LoginUser called with:", {
        token: token ? "***" : "null",
        email,
        name,
        isAdmin: isAdminFlag,
      });

      // Fetch user's cart after login
      const cartRes = await axios.get("http://localhost:3000/get-cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCartItems(cartRes.data.cartData || {});

      console.log("User successfully logged in:", { email, name });
    } catch (error) {
      console.error("Failed to fetch cart after login:", error);
    }
  };

  const fetchCategoryProducts = useCallback(
    async (category, page = 1, limit = 12) => {
      try {
        const response = await axios.get(
          "http://localhost:3000/products-by-category",
          {
            params: { category, page, limit },
          }
        );
        return {
          products: response.data.products,
          total: response.data.total,
        };
      } catch (error) {
        console.error("Failed to fetch category products:", error);
        return { products: [], total: 0 };
      }
    },
    []
  );

  const clearCart = async () => {
    setCartItems({});
    if (user?.token) {
      try {
        await axios.post(
          "http://localhost:3000/update-cart",
          { cartData: {} },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      } catch (error) {
        console.error("Failed to clear cart on backend:", error);
      }
    }
  };

  const getTotalCartAmount = () =>
    Object.values(cartItems).reduce((total, item) => {
      const price = Number(item?.price) || 0;
      const quantity = Number(item?.quantity) || 0;
      return total + price * quantity;
    }, 0);

  const getTotalItemsInCart = useCallback(() => {
    return Object.values(cartItems).reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }, [cartItems]);

  useEffect(() => {
    getTotalItemsInCart();
  }, [cartItems, getTotalItemsInCart]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  useEffect(() => {
    // Update localStorage when theme changes
    localStorage.setItem("theme", darkMode ? "dark" : "light");

    // Update body class for theme
    if (darkMode) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [darkMode]);

  // Debug: Log user state changes
  useEffect(() => {
    console.log("User state updated:", user);
  }, [user]);

  return (
    <HomeContext.Provider
      value={{
        products,
        productsLoading,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        clearCart,
        getTotalCartAmount,
        getTotalItemsInCart,
        user,
        isAdmin,
        isLoggedIn: !!user,
        loginUser,
        logout,
        loading,
        fetchCategoryProducts,
        darkMode,
        toggleDarkMode,
      }}
    >
      {!loading && !productsLoading && children}
    </HomeContext.Provider>
  );
};

export default HomeProvider;
