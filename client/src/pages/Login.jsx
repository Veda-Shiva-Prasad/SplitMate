import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useData } from "../context/DataContext";
import "./Auth.css";

const API_URL = (
  process.env.REACT_APP_API_URL || "https://splitmate-0a2j.onrender.com/api"
).replace(/\/+$/, "");

const Login = () => {
  const navigate = useNavigate();
  const { refreshData } = useData();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("splitmate_auth_theme") === "dark",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem("splitmate_auth_theme", darkMode ? "dark" : "light");

    return () => {
      // Preserve the selected theme for the next authentication page.
    };
  }, [darkMode]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (busy) return;

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      const { token, user } = response.data || {};

      if (!token || !user) {
        throw new Error("The server returned an invalid login response.");
      }

      ["user", "userName", "userEmail", "userPhone", "userPhoto"].forEach(
        (key) => localStorage.removeItem(key),
      );

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("userName", user.name || "");
      localStorage.setItem("userEmail", user.email || "");
      localStorage.setItem("userPhone", user.phone || "");

      if (user.profilePhoto) {
        localStorage.setItem("userPhoto", user.profilePhoto);
      }

      navigate("/dashboard", { replace: true });

      Promise.resolve()
        .then(() => refreshData())
        .catch((refreshError) => {
          console.error("Dashboard refresh failed:", refreshError);
        });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to log in. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link className="auth-brand" to="/login" aria-label="SplitMate login">
          <span className="auth-brand-mark" aria-hidden="true">
            S
          </span>
          <span>SplitMate</span>
        </Link>

        <button
          type="button"
          className="auth-theme-toggle"
          onClick={() => setDarkMode((previous) => !previous)}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={darkMode ? "Light mode" : "Dark mode"}
        >
          {darkMode ? "☀" : "☾"}
        </button>
      </header>

      <div className="auth-layout">
        <section className="auth-visual">
          <div className="auth-visual-content">
            <span className="auth-eyebrow">
              <span aria-hidden="true">✦</span>
              Smarter money management
            </span>

            <h1>
              Take control
              <br />
              of your finances.
            </h1>

            <p>
              Understand your spending, organize your budgets, and stay focused
              on your financial goals with SplitMate.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-icon" aria-hidden="true">
                  ✓
                </span>
                <span>Track your expenses in one place</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-icon" aria-hidden="true">
                  ◈
                </span>
                <span>Manage budgets and financial goals</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-icon" aria-hidden="true">
                  ↗
                </span>
                <span>Make more informed money decisions</span>
              </div>
            </div>
          </div>

          <div className="auth-visual-decoration" aria-hidden="true">
            <span className="auth-decoration-circle auth-circle-one" />
            <span className="auth-decoration-circle auth-circle-two" />
          </div>
        </section>

        <section className="auth-form-panel" aria-labelledby="login-heading">
          <div className="auth-form-content">
            <span className="auth-form-kicker">WELCOME BACK</span>

            <h2 className="auth-heading" id="login-heading">
              Sign in to SplitMate
            </h2>

            <p className="auth-subheading">
              Enter your account details to continue.
            </p>

            {error && (
              <div className="auth-error" role="alert" aria-live="polite">
                <span aria-hidden="true">!</span>
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="login-email">Email address</label>
                <input
                  className="auth-input"
                  id="login-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  maxLength={254}
                  required
                  disabled={busy}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="login-password">Password</label>

                <div className="auth-input-wrap">
                  <input
                    className="auth-input auth-input-password"
                    id="login-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    disabled={busy}
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    disabled={busy}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button className="auth-button" type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer">
              Don't have an account?{" "}
              <Link className="auth-link" to="/register">
                Create an account
              </Link>
            </p>

            <p className="auth-security-note">
              <span aria-hidden="true">▣</span> Your account is protected by
              secure authentication.
            </p>
          </div>
        </section>
      </div>

      <footer className="auth-page-footer">
        Made for better financial habits.
      </footer>
    </main>
  );
};

export default Login;
