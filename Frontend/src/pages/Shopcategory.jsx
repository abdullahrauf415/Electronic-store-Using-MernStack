import React, { useState, useEffect, useRef } from "react";
import "./CSS/ShopeCategory.css";
import Item from "../Components/Item/Item";
import { FiLoader } from "react-icons/fi";
import axios from "axios";

// Constants
const PRODUCTS_PER_PAGE = 12;
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes cache

const ShopCategory = ({ category }) => {
  // State management
  const [page, setPage] = useState(1);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Ref for caching and abort controller
  const cacheRef = useRef({});
  const abortControllerRef = useRef(null);

  // Reset state when category changes
  useEffect(() => {
    const cachedData = cacheRef.current[category];

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
      // Use cached data if available and not expired
      setCategoryProducts(cachedData.products);
      setTotalProducts(cachedData.total);
      setPage(cachedData.page);
      setIsInitialLoading(false);
    } else {
      // Reset state for new category
      setPage(1);
      setCategoryProducts([]);
      setTotalProducts(0);
      setIsInitialLoading(true);
      setError(null);
    }
  }, [category]);

  // Fetch products when category or page changes
  useEffect(() => {
    const fetchProducts = async () => {
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Set loading states
        if (page === 1 && categoryProducts.length === 0) {
          setIsInitialLoading(true);
        } else {
          setIsLoadingMore(true);
        }

        setError(null);

        const response = await axios.get(
          `http://localhost:3000/products-by-category`,
          {
            params: {
              category,
              page,
              limit: PRODUCTS_PER_PAGE,
            },
            signal: controller.signal,
          }
        );

        // Update state with new products
        const newProducts = response.data.products;
        const updatedProducts =
          page === 1 ? newProducts : [...categoryProducts, ...newProducts];

        setCategoryProducts(updatedProducts);

        // FIX: Only update totalProducts on first page
        if (page === 1) {
          setTotalProducts(response.data.total);
        }

        // Update cache
        cacheRef.current[category] = {
          products: updatedProducts,
          total: page === 1 ? response.data.total : totalProducts,
          page: page,
          timestamp: Date.now(),
        };
      } catch (error) {
        if (!axios.isCancel(error)) {
          console.error("Fetch error:", error);
          setError(`Failed to load products. Please try again.`);
        }
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    };

    // Only fetch if we don't have cached data for this page
    const cachedData = cacheRef.current[category];
    if (!(cachedData && cachedData.page >= page)) {
      fetchProducts();
    } else {
      setIsInitialLoading(false);
      setIsLoadingMore(false);
    }

    // Cleanup: abort request on unmount or dependency change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [category, page]);

  const handleLoadMore = () => {
    if (
      !isInitialLoading &&
      !isLoadingMore &&
      categoryProducts.length < totalProducts
    ) {
      setPage((prev) => prev + 1);
    }
  };

  // Loading state for initial load
  if (isInitialLoading) {
    return (
      <div className="shopcategory-loading">
        <div className="skeleton-grid">
          {Array.from({ length: 12 }).map((_, idx) => (
            <div key={idx} className="skeleton-item">
              <div className="skeleton-image"></div>
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
              <div className="skeleton-line shorter"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="shopcategory-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button
          className="retry-button"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  // Empty state
  if (categoryProducts.length === 0 && !isInitialLoading) {
    return (
      <div className="shopcategory-empty">
        <h2>No products found in {category}</h2>
        <p>We couldn't find any products in this category.</p>
        <button
          className="browse-button"
          onClick={() => (window.location.href = "/")}
        >
          Browse Other Categories
        </button>
      </div>
    );
  }

  return (
    <div className="shopcategory">
      <div className="shopcategory_header">
        <h1>{category}</h1>
        <p className="product-count">
          Showing {categoryProducts.length} of {totalProducts} products
        </p>
      </div>

      <div className="shopcategory_product">
        {categoryProducts.map((product) => {
          const firstSize = product.size?.[0] || {};
          return (
            <Item
              key={`${product.id}-${product.updatedAt || Date.now()}`}
              id={product.id}
              name={product.name}
              image={product.image}
              description={product.description}
              new_price={firstSize.new_price || 0}
              old_price={firstSize.old_price || 0}
            />
          );
        })}
      </div>

      {categoryProducts.length < totalProducts && (
        <button
          className={`shopcategory_loadmore ${isLoadingMore ? "loading" : ""}`}
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          aria-busy={isLoadingMore}
        >
          {isLoadingMore ? (
            <FiLoader
              className="spin-icon"
              aria-label="Loading more products"
            />
          ) : (
            "Explore More"
          )}
        </button>
      )}
    </div>
  );
};

export default ShopCategory;
