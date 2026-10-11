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

export default function Register() {
  const navigate = useNavigate();
  const { refreshData } = useData();

  const [theme, setTheme] = useState(getSavedTheme);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await API.post("/auth/register", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      const data = response.data;

      if (!data?.token || !data?.user) {
        throw new Error(
          "Registration succeeded without a complete login response. Please try logging in.",
        );
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
          "Unable to create your account. Please try again.",
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
            <span className="auth-eyebrow">✦ Your money, organized</span>
            <h1>A better way to manage money together.</h1>
            <p>
              Create your account and bring your expenses, budgets, goals, and
              settlements into one organized space.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>One place for your expenses</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>Clear budgets and financial goals</span>
              </div>
              <div className="auth-feature">
                <span className="auth-feature-icon">✓</span>
                <span>A simple view of what you owe</span>
              </div>
            </div>
          </div>
        </aside>

        <section className="auth-form-panel">
          <h2 className="auth-heading">Create your account</h2>
          <p className="auth-subheading">
            Join SplitMate and get your expenses organized.
          </p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="register-name">Full name</label>
              <input
                id="register-name"
                className="auth-input"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email address</label>
              <input
                id="register-email"
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
              <label htmlFor="register-password">Password</label>
              <div className="auth-input-wrap">
                <input
                  id="register-password"
                  className="auth-input auth-input-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  minLength={6}
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

            <div className="auth-field">
              <label htmlFor="register-confirm-password">
                Confirm password
              </label>
              <input
                id="register-confirm-password"
                className="auth-input"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
                disabled={isSubmitting}
              />
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating account..." : "Create account →"}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Sign in
            </Link>
          </p>

          <p className="auth-security-note">
            ♢ Create an account to access your personal SplitMate data.
          </p>
        </section>
      </section>
    </main>
  );
}
