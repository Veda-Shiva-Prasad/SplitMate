import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/api";
import { useData } from "../context/DataContext";
import "./Auth.css";

function getSavedTheme() {
  try {
    return localStorage.getItem("splitmate-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export default function Login() {
  const navigate = useNavigate();
  const { refreshData } = useData();

  const [theme, setTheme] = useState(getSavedTheme);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("splitmate-theme", theme);
    } catch {
      // Theme still works for this page if storage is unavailable.
    }
  }, [theme]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await API.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response.data;

      if (!data?.token || !data?.user) {
        throw new Error("The server returned an incomplete login response.");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("userName", data.user.name || "");
      localStorage.setItem("userEmail", data.user.email || "");

      await refreshData();
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to log in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link to="/login" className="auth-brand" aria-label="SplitMate home">
          <span className="auth-brand-mark">S</span>
          <span>SplitMate</span>
        </Link>

        <button
          type="button"
          className="auth-theme-toggle"
          onClick={() =>
            setTheme((current) => (current === "light" ? "dark" : "light"))
          }
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          {theme === "light" ? "☾" : "☀"}
        </button>
      </header>

      <section className="auth-layout">
        <aside className="auth-visual">
          <div className="auth-visual-content">
            <span className="auth-eyebrow">✦ Smart expense management</span>
            <h1>Make shared expenses feel simple.</h1>
            <p>
              Keep track of spending, manage shared costs, and understand where
              your money goes—all in one place.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-icon">↗</span>
                <span>Track expenses and spending</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">◎</span>
                <span>Organize budgets and savings goals</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">⇄</span>
                <span>Manage money owed and settlements</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="auth-form-panel">
          <h2 className="auth-heading">Welcome back </h2>
          <p className="auth-subheading">
            Sign in to continue to your SplitMate account.
          </p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="login-password"
                  className="auth-input auth-input-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Signing in..." : "Sign in to SplitMate →"}
            </button>
          </form>

          <p className="auth-footer">
            New to SplitMate?{" "}
            <Link to="/register" className="auth-link">
              Create an account
            </Link>
          </p>

          <p className="auth-security-note">
            ♢ Your account and expense data stay protected by your login.
          </p>
        </section>
      </section>
    </main>
  );
}
