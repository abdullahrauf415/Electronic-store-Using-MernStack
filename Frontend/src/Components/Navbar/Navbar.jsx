import React, { useContext, useRef, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import HomeContext from "../../Context/HomeContext";
import { FaSearch, FaChevronDown, FaChevronUp, FaUser } from "react-icons/fa";
import "./Navbar.css";

const Navbar = () => {
  const [menu, setMenu] = useState("Home");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(null);

  const {
    getTotalItemsInCart,
    products = [],
    isLoggedIn = false,
    isAdmin = false,
    logout,
    user,
  } = useContext(HomeContext);

  const menuref = useRef();
  const profileRef = useRef(); // Added new ref for profile dropdown
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

  const toggleSubmenu = (menuItem) => {
    if (submenuOpen === menuItem) {
      setSubmenuOpen(null);
    } else {
      setSubmenuOpen(menuItem);
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Mobile menu
      if (menuref.current && !menuref.current.contains(event.target)) {
        setMenuOpen(false);
      }

      // Profile dropdown
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
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
        <div className="logo-placeholder">GS</div>
        <div className="logo-text">
          <span className="logo-title">GadgetStore</span>
          <span className="logo-subtitle">
            AI Assisted Electronics And Gadgets Store
          </span>
        </div>
      </div>

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
          <li
            key={item}
            className="nav-menu-item"
            onMouseEnter={() => toggleSubmenu(item)}
            onMouseLeave={() => setSubmenuOpen(null)}
          >
            <Link
              to={`/${item === "Home" ? "" : item}`}
              className={`nav-link ${menu === item ? "active" : ""}`}
              onClick={() => {
                setMenu(item);
                setMenuOpen(false);
                if (item === "Home") {
                  navigate("/", { replace: true });
                }
              }}
            >
              {item === "Electronics" ? "Household Appliances" : item}
              {item !== "Home" && (
                <span className="dropdown-icon">
                  {submenuOpen === item ? <FaChevronUp /> : <FaChevronDown />}
                </span>
              )}
            </Link>

            {item !== "Home" && submenuOpen === item && (
              <div className="submenu">
                <div className="submenu-content">
                  <h4>Popular {item}</h4>
                  <div className="submenu-items">
                    {products
                      .filter(
                        (p) => p.category.toLowerCase() === item.toLowerCase()
                      )
                      .slice(0, 4)
                      .map((product) => (
                        <Link
                          key={product.id}
                          to={`/product/${product.id}`}
                          className="submenu-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          <div className="submenu-product">
                            <div className="submenu-img-placeholder"></div>
                            <div className="submenu-product-name">
                              {product.name}
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                  <Link
                    to={`/${item}`}
                    className="view-all"
                    onClick={() => setMenuOpen(false)}
                  >
                    View All {item} →
                  </Link>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="nav-user-actions">
        {isLoggedIn ? (
          <div
            className="profile-dropdown-wrapper"
            ref={profileRef} // Added ref for profile dropdown
            onMouseEnter={() => setShowProfileDropdown(true)}
            onMouseLeave={() => setShowProfileDropdown(false)}
          >
            <div
              className="profile-icon"
              tabIndex={0}
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setShowProfileDropdown(!showProfileDropdown);
                }
              }}
              aria-haspopup="true"
              aria-expanded={showProfileDropdown}
              role="button"
              title="Profile"
            >
              <FaUser className="user-icon" />
              <span className="profile-initial">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            {showProfileDropdown && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="profile-avatar">
                    <span>{user?.email?.[0]?.toUpperCase() || "U"}</span>
                  </div>
                  <div className="profile-details">
                    <span className="profile-initial">
                      {user && user.name ? user.name[0].toUpperCase() : "U"}
                    </span>
                    <div className="profile-name">{user?.name || "User"}</div>
                    <div className="profile-email">
                      {user?.email || "user@example.com"}
                    </div>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                {isAdmin ? (
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/admin");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <div className="dropdown-icon">🛠</div>
                    Admin Dashboard
                  </div>
                ) : (
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      navigate("/UserProfile");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <div className="dropdown-icon">👤</div>
                    Your Profile
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
                  <div className="dropdown-icon">🚪</div>
                  Logout
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
          <Link to="/cart" className="cart-link">
            <div className="cart-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </div>
            <div className="cart-badge">{getTotalItemsInCart()}</div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
