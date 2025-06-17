import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CSS/LoginSignup.css";
import HomeContext from "../Context/HomeContext";

const LoginSignup = () => {
  const navigate = useNavigate();
  const { loginUser, user } = useContext(HomeContext);

  const [isSignup, setIsSignup] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (!form.email || !form.password || (isSignup && !form.name)) {
      alert("Please fill in all required fields.");
      return false;
    }
    if (isSignup && !agree) {
      alert("Please agree to the Terms of Service and Privacy Policy.");
      return false;
    }
    return true;
  };

  const handleLoginSignup = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const endpoint = isSignup
        ? "http://localhost:3000/signup"
        : "http://localhost:3000/login";

      const requestBody = isSignup
        ? {
            name: form.name,
            email: form.email,
            password: form.password,
          }
        : {
            email: form.email,
            password: form.password,
          };

      const response = await axios.post(endpoint, requestBody);
      setLoading(false);

      if (response.data?.success && response.data.token) {
        // Save token and isAdmin flag to localStorage
        localStorage.setItem("token", response.data.token);
        localStorage.setItem(
          "isAdmin",
          response.data.isAdmin ? "true" : "false"
        );

        // Update context user state
        await loginUser(
          response.data.token,
          response.data.email,
          response.data.isAdmin
        );
        navigate("/");
      } else {
        alert(response.data?.message || "Authentication failed");
      }
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.errors ||
        "Authentication failed";
      console.error(errorMessage);
      alert(errorMessage);
    }
  };

  const toggleForm = () => {
    setIsSignup(!isSignup);
    setForm({ name: "", email: "", password: "" });
    setAgree(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="loginSignup">
      <div className="loginSignup-container">
        <h1>{isSignup ? "Sign Up" : "Log In"}</h1>
        <form className="loginSignup-form" onSubmit={(e) => e.preventDefault()}>
          {isSignup && (
            <input
              type="text"
              name="name"
              placeholder="Name"
              value={form.name}
              onChange={handleChange}
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {isSignup && (
            <div className="checkbox-container">
              <input
                type="checkbox"
                id="agree"
                checked={agree}
                onChange={() => setAgree(!agree)}
              />
              <label htmlFor="agree">
                I agree to the <span>Terms of Service</span> and{" "}
                <span>Privacy Policy</span>
              </label>
            </div>
          )}

          <button
            type="button"
            className="signup-button"
            onClick={handleLoginSignup}
            disabled={loading}
          >
            {loading
              ? isSignup
                ? "Creating Account..."
                : "Signing In..."
              : isSignup
              ? "Create Account"
              : "Sign In"}
          </button>

          <p className="loginsignup-toggle">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <span onClick={toggleForm}>Log in here</span>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <span onClick={toggleForm}>Create account</span>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginSignup;
