import "./Navbar.css";
import nav_dropdown from "../Assets/nav_dropdown.png";
import logo from "../Assets/logo.png";
import cart_icon from "../Assets/cart_icon.png";
import { useContext, useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import HomeContext from "../../Context/HomeContext";
import { FaSearch } from "react-icons/fa";

const Navbar = () => {
  const [menu, setMenu] = useState("Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const {
    getTotalItemsInCart,
    products = [],
    isLoggedIn = false,
    isAdmin = false,
    logout,
    user,
  } = useContext(HomeContext);

  const menuref = useRef();
  const navigate = useNavigate();
  const location = useLocation();

  const filteredProducts = products
    .filter((product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, 5);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
      if (filteredProducts.length > 0) {
        handleProductSelect(filteredProducts[activeSuggestion].id);
      }
    }

    if (filteredProducts.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveSuggestion((prev) =>
          Math.min(prev + 1, filteredProducts.length - 1)
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveSuggestion((prev) => Math.max(prev - 1, 0));
        break;
      default:
        break;
    }
  };

  const handleProductSelect = (productId) => {
    setSearchQuery("");
    setShowSuggestions(false);
    navigate(`/product/${productId}`);
  };

  useEffect(() => {
    const currentPath = location.pathname;
    let activeMenuItem = "Home";

    if (currentPath === "/") {
      activeMenuItem = "Home";
    } else {
      const pathParts = currentPath.split("/");
      const category = pathParts[1];
      if (category) {
        const formattedCategory =
          category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
        const validMenuItems = ["Electronics", "Gadgets", "Accessories"];
        if (validMenuItems.includes(formattedCategory)) {
          activeMenuItem = formattedCategory;
        }
      }
    }
    setMenu(activeMenuItem);
  }, [location.pathname]);

  const dropdown_toggle = (e) => {
    menuref.current.classList.toggle("nav-menu-visible");
    e.target.classList.toggle("open");
  };

  return (
    <div className="navbar">
      <div className="nav-logo">
        <img src={logo} alt="logo" className="logo" />
        <p>
          GadgetStore<span>AI Assisted Electronics And Gadgets Store</span>
        </p>
      </div>

      <img
        src={nav_dropdown}
        alt="menu"
        className="nav-dropdown"
        onClick={dropdown_toggle}
      />
      <ul ref={menuref} className="nav-menu">
        {["Home", "Electronics", "Gadgets", "Accessories"].map((item) => (
          <li key={item}>
            <Link
              to={`/${item === "Home" ? "" : item}`}
              style={{ textDecoration: "none" }}
              onClick={() => {
                setMenu(item);
                if (item === "Home") {
                  navigate("/", { replace: true });
                }
              }}
            >
              {item === "Electronics" ? "Household Appliances" : item}
            </Link>
            {menu === item && <hr />}
          </li>
        ))}
      </ul>

      <div className="nav-login-cart">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Search products..."
              className="nav-search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(!!e.target.value);
              }}
              onKeyDown={handleKeyDown}
            />
            <button className="search-icon-button" onClick={handleSearch}>
              <FaSearch className="search-icon" />
            </button>
          </div>

          {showSuggestions && (
            <div className="suggestions-dropdown">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className={`suggestion-item ${
                      index === activeSuggestion ? "active" : ""
                    }`}
                    onClick={() => handleProductSelect(product.id)}
                    onMouseEnter={() => setActiveSuggestion(index)}
                  >
                    <span className="product-name">{product.name}</span>
                  </div>
                ))
              ) : (
                <div className="no-results">No products found</div>
              )}
            </div>
          )}
        </div>

        {isLoggedIn ? (
          <div
            className="profile-dropdown-wrapper"
            onMouseEnter={() => setShowProfileDropdown(true)}
            onMouseLeave={() => setShowProfileDropdown(false)}
          >
            <div className="profile-icon" title="Profile">
              <span>{user?.email?.[0]?.toUpperCase() || "U"}</span>
            </div>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                {isAdmin ? (
                  <div
                    className="dropdown-item"
                    onClick={() => navigate("/admin")}
                  >
                    🛠 Admin Dashboard
                  </div>
                ) : (
                  <div
                    className="dropdown-item"
                    onClick={() => navigate("/UserProfile")}
                  >
                    👤 Your Profile
                  </div>
                )}
                <div
                  className="dropdown-item logout"
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  🚪 Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <button>Login</button>
          </Link>
        )}

        <div className="nav-cart-wrapper">
          <Link to="/cart">
            <img src={cart_icon} alt="cart" />
          </Link>
          <div className="nav-cart-count">{getTotalItemsInCart()}</div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
