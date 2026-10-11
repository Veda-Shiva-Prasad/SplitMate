import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, Bell, LogOut, ChevronDown } from "lucide-react";
import { useData } from "../context/DataContext";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Budget", path: "/budget" },
  { label: "Categories", path: "/categories" },
  { label: "Recurring", path: "/recurring" },
  { label: "Goals", path: "/goals" },
  { label: "Insights", path: "/insights" },
  { label: "Reports", path: "/reports" },
  { label: "Activity", path: "/activity" },
  { label: "Settings", path: "/settings" },
];

const Navbar = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { transactions, budgets, goals } = useData();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userName, setUserName] = useState(
    localStorage.getItem("userName") || "User",
  );
  const [userEmail, setUserEmail] = useState(
    localStorage.getItem("userEmail") || "",
  );
  const [userPhoto, setUserPhoto] = useState(
    localStorage.getItem("userPhoto") || "",
  );

  useEffect(() => {
    const syncProfile = () => {
      setUserName(localStorage.getItem("userName") || "User");
      setUserEmail(localStorage.getItem("userEmail") || "");
      setUserPhoto(localStorage.getItem("userPhoto") || "");
    };

    syncProfile();
    window.addEventListener("storage", syncProfile);
    window.addEventListener("splitmate-profile-updated", syncProfile);

    return () => {
      window.removeEventListener("storage", syncProfile);
      window.removeEventListener("splitmate-profile-updated", syncProfile);
    };
  }, []);

  const theme = {
    card: isDarkMode ? "#111827" : "#ffffff",
    border: isDarkMode ? "#26334b" : "#e2e8f0",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    secondary: isDarkMode ? "#94a3b8" : "#64748b",
    primary: "#3b82f6",
    hover: isDarkMode ? "#1e293b" : "#f1f5f9",
  };

  const handleLogout = () => {
    [
      "token",
      "user",
      "userName",
      "userEmail",
      "userPhone",
      "userPhoto",
    ].forEach((key) => localStorage.removeItem(key));

    navigate("/login", { replace: true });
  };

  const navButtonStyle = (active) => ({
    flexShrink: 0,
    whiteSpace: "nowrap",
    background: active ? `${theme.primary}20` : "transparent",
    color: active ? theme.primary : theme.secondary,
    border: "none",
    padding: "9px 12px",
    borderRadius: "9px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: active ? 700 : 600,
    transition: "background 0.2s, color 0.2s",
  });

  return (
    <nav
      style={{
        minHeight: 70,
        background: theme.card,
        borderBottom: `1px solid ${theme.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        padding: "10px 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        flexWrap: "wrap",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 22,
          flex: "1 1 650px",
          minWidth: 0,
        }}
      >
        <button
          type="button"
          onClick={() => {
            navigate("/dashboard");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          title="Go to dashboard"
          className="splitmate-logo"
          style={{
            color: theme.primary,
            fontWeight: 900,
            fontSize: 23,
            border: 0,
            background: "transparent",
            cursor: "pointer",
            flexShrink: 0,
            transition: "transform 0.2s ease",
          }}
        >
          SplitMate
        </button>

        <div
          style={{
            display: "flex",
            gap: 3,
            overflowX: "auto",
            flex: 1,
            minWidth: 0,
            scrollbarWidth: "thin",
            paddingBottom: 2,
          }}
        >
          {navItems.map((item) => {
            const active = location.pathname === item.path;

            return (
              <button
                type="button"
                key={item.path}
                onClick={() => navigate(item.path)}
                style={navButtonStyle(active)}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = theme.hover;
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setIsDarkMode(!isDarkMode)}
          title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle color theme"
          style={{
            border: 0,
            background: "transparent",
            color: theme.secondary,
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            padding: 7,
          }}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button
          type="button"
          onClick={() => navigate("/notifications")}
          title="View notifications"
          aria-label="Open notifications"
          style={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            border: 0,
            background: "transparent",
            color: theme.secondary,
            cursor: "pointer",
            padding: 7,
          }}
        >
          <Bell size={20} />
          {(transactions.length > 0 ||
            budgets.length > 0 ||
            goals.length > 0) && (
            <span
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#f59e0b",
              }}
            />
          )}
        </button>

        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowUserMenu((current) => !current)}
            aria-expanded={showUserMenu}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: 0,
              background: "transparent",
              cursor: "pointer",
              color: theme.text,
            }}
          >
            {userPhoto ? (
              <img
                src={userPhoto}
                alt="Profile"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: `2px solid ${theme.primary}`,
                }}
              />
            ) : (
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  background: "linear-gradient(135deg,#3b82f6,#6366f1)",
                  color: "white",
                  fontWeight: 800,
                }}
              >
                {(userName.charAt(0) || "U").toUpperCase()}
              </span>
            )}

            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {userName.split(" ")[0]}
            </span>
            <ChevronDown size={14} />
          </button>

          {showUserMenu && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: 48,
                width: 235,
                background: theme.card,
                color: theme.text,
                border: `1px solid ${theme.border}`,
                borderRadius: 14,
                boxShadow: "0 16px 40px rgba(0,0,0,0.2)",
                overflow: "hidden",
                zIndex: 300,
              }}
            >
              <div
                style={{
                  padding: 16,
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <strong>{userName}</strong>
                <p
                  style={{
                    margin: "4px 0 0",
                    color: theme.secondary,
                    fontSize: 12,
                    overflowWrap: "anywhere",
                  }}
                >
                  {userEmail}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowUserMenu(false);
                  navigate("/settings");
                }}
                style={{
                  width: "100%",
                  padding: 13,
                  border: 0,
                  background: "transparent",
                  color: theme.text,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                ⚙️ Settings
              </button>

              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: 13,
                  border: 0,
                  background: "transparent",
                  color: "#ef4444",
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>

      {showUserMenu && (
        <button
          type="button"
          aria-label="Close account menu"
          onClick={() => setShowUserMenu(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 90,
            background: "transparent",
            border: 0,
            cursor: "default",
          }}
        />
      )}
    </nav>
  );
};

export default Navbar;
