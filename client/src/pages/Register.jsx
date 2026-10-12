import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useData } from "../context/DataContext";
import "./Auth.css";

const API_URL = (
  process.env.REACT_APP_API_URL || "https://splitmate-0a2j.onrender.com/api"
).replace(/\/+$/, "");

const Register = () => {
  const navigate = useNavigate();
  const { refreshData } = useData();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const { password, confirmPassword } = formData;

    if (name.length < 2 || name.length > 80) {
      setError("Name must be between 2 and 80 characters.");
      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6 || password.length > 128) {
      setError("Password must be between 6 and 128 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
      });

      const { token, user } = response.data || {};

      if (!token || !user) {
        throw new Error(
          "The server returned an invalid registration response.",
        );
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

      navigate("/", { replace: true });

      Promise.resolve()
        .then(() => refreshData())
        .catch((refreshError) => {
          console.error("Dashboard refresh failed:", refreshError);
        });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          "Unable to create your account. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <header className="auth-topbar">
        <Link
          className="auth-brand"
          to="/register"
          aria-label="SplitMate register"
        >
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

      <div className="auth-layout auth-layout-register">
        <section className="auth-visual">
          <div className="auth-visual-content">
            <span className="auth-eyebrow">
              <span aria-hidden="true">✦</span>
              Your financial journey starts here
            </span>

            <h1>
              Build better
              <br />
              money habits.
            </h1>

            <p>
              Bring your expenses, budgets, and savings goals together in one
              organized space.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <span className="auth-feature-icon" aria-hidden="true">
                  ✓
                </span>
                <span>Get a clearer view of your spending</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-icon" aria-hidden="true">
                  ◈
                </span>
                <span>Organize budgets and savings goals</span>
              </div>

              <div className="auth-feature">
                <span className="auth-feature-icon" aria-hidden="true">
                  ↗
                </span>
                <span>Keep your financial records organized</span>
              </div>
            </div>
          </div>

          <div className="auth-visual-decoration" aria-hidden="true">
            <span className="auth-decoration-circle auth-circle-one" />
            <span className="auth-decoration-circle auth-circle-two" />
          </div>
        </section>

        <section className="auth-form-panel" aria-labelledby="register-heading">
          <div className="auth-form-content">
            <span className="auth-form-kicker">GET STARTED FOR FREE</span>

            <h2 className="auth-heading" id="register-heading">
              Create your account
            </h2>

            <p className="auth-subheading">
              Enter your details to start using SplitMate.
            </p>

            {error && (
              <div className="auth-error" role="alert" aria-live="polite">
                <span aria-hidden="true">!</span>
                <span>{error}</span>
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="auth-field">
                <label htmlFor="register-name">Full name</label>
                <input
                  className="auth-input"
                  id="register-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  minLength={2}
                  maxLength={80}
                  required
                  disabled={busy}
                />
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">Email address</label>
                <input
                  className="auth-input"
                  id="register-email"
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
                <label htmlFor="register-password">Password</label>

                <div className="auth-input-wrap">
                  <input
                    className="auth-input auth-input-password"
                    id="register-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    minLength={6}
                    maxLength={128}
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

              <div className="auth-field">
                <label htmlFor="register-confirm-password">
                  Confirm password
                </label>

                <div className="auth-input-wrap">
                  <input
                    className="auth-input auth-input-password"
                    id="register-confirm-password"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    minLength={6}
                    maxLength={128}
                    required
                    disabled={busy}
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowConfirmPassword((previous) => !previous)
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                    aria-pressed={showConfirmPassword}
                    disabled={busy}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button className="auth-button" type="submit" disabled={busy}>
                {busy ? (
                  <>
                    <span className="auth-spinner" aria-hidden="true" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <span aria-hidden="true">→</span>
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer">
              Already have an account?{" "}
              <Link className="auth-link" to="/login">
                Sign in
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

export default Register;
