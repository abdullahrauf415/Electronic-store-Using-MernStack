import "./Navbar.css";
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
  const [menuOpen, setMenuOpen] = useState(false);

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

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuref.current && !menuref.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="navbar">
      <div className="nav-logo">
        <img src={logo} alt="logo" className="logo" />
        <div className="logo-text">
          <span className="primary">GadgetStore</span>
          <span className="secondary">
            AI Assisted Electronics And Gadgets Store
          </span>
        </div>
      </div>

      <button
        className={`menu-toggle ${menuOpen ? "active" : ""}`}
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        <span className="menu-icon"></span>
      </button>

      <ul ref={menuref} className={`nav-menu ${menuOpen ? "active" : ""}`}>
        {["Home", "Electronics", "Gadgets", "Accessories"].map((item) => (
          <li key={item}>
            <Link
              to={`/${item === "Home" ? "" : item}`}
              className="nav-link"
              onClick={() => {
                setMenu(item);
                setMenuOpen(false);
                if (item === "Home") {
                  navigate("/", { replace: true });
                }
              }}
            >
              {item === "Electronics" ? "Household Appliances" : item}
              {menu === item && <hr />}
            </Link>
          </li>
        ))}
      </ul>

      <div className="nav-actions">
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
              onFocus={() => setShowSuggestions(!!searchQuery)}
            />
            <button
              className="search-icon-button"
              onClick={handleSearch}
              aria-label="Search"
            >
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
                    onClick={() => {
                      navigate("/admin");
                      setShowProfileDropdown(false);
                    }}
                  >
                    🛠 Admin Dashboard
                  </div>
                ) : (
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/UserProfile");
                      setShowProfileDropdown(false);
                    }}
                  >
                    👤 Your Profile
                  </div>
                )}
                <div className="dropdown-divider"></div>
                <div
                  className="dropdown-item logout"
                  onClick={() => {
                    logout();
                    navigate("/");
                    setShowProfileDropdown(false);
                  }}
                >
                  🚪 Logout
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login">
            <button className="auth-button">Login</button>
          </Link>
        )}

        <div className="cart-icon-wrapper">
          <Link to="/cart">
            <img src={cart_icon} alt="cart" className="cart-icon" />
          </Link>
          <div className="cart-badge">{getTotalItemsInCart()}</div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
