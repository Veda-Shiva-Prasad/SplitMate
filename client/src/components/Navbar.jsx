import React, { useEffect, useMemo, useState } from "react";
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronDown,
  Wallet,
  Target,
  CalendarClock,
  Menu,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useData } from "../context/DataContext";
import { buildNotifications } from "../utils/notifications";
import "./Navbar.css";

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

const readIds = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const Navbar = ({ isDarkMode = false, setIsDarkMode = () => {} }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    transactions = [],
    budgets = [],
    goals = [],
    recurring = [],
  } = useData();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const [readVersion, setReadVersion] = useState(0);

  useEffect(() => {
    const updateProfile = () => setProfileVersion((version) => version + 1);

    const updateReadStatus = () => setReadVersion((version) => version + 1);

    window.addEventListener("storage", updateProfile);
    window.addEventListener("splitmate-profile-updated", updateProfile);
    window.addEventListener("splitmate-notifications-read", updateReadStatus);

    return () => {
      window.removeEventListener("storage", updateProfile);
      window.removeEventListener("splitmate-profile-updated", updateProfile);
      window.removeEventListener(
        "splitmate-notifications-read",
        updateReadStatus,
      );
    };
  }, []);

  const currentUser = useMemo(() => getStoredUser(), [profileVersion]);

  const userName =
    localStorage.getItem("userName") || currentUser.name || "User";

  const userEmail =
    localStorage.getItem("userEmail") || currentUser.email || "";

  const userPhoto =
    localStorage.getItem("userPhoto") || currentUser.profilePhoto || "";

  const userInitial = userName.trim().charAt(0).toUpperCase() || "U";

  const notifications = useMemo(
    () =>
      buildNotifications({
        transactions,
        budgets,
        goals,
        recurring,
      }),
    [transactions, budgets, goals, recurring],
  );

  const userKey =
    currentUser._id ||
    currentUser.id ||
    localStorage.getItem("userEmail") ||
    "guest";

  const readStorageKey = `splitmate-read-notifications-${userKey}`;

  const readNotificationIds = useMemo(
    () => readIds(readStorageKey),
    [readStorageKey, readVersion],
  );

  const unreadCount = notifications.filter(
    (notification) => !readNotificationIds.includes(notification.id),
  ).length;

  const theme = {
    card: isDarkMode ? "#111827" : "#ffffff",
    border: isDarkMode ? "#26334b" : "#e2e8f0",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    secondary: isDarkMode ? "#94a3b8" : "#64748b",
    primary: "#3b82f6",
  };

  const closeMenus = () => {
    setShowNotifs(false);
    setShowUserMenu(false);
    setShowMobileNav(false);
  };

  const goTo = (path) => {
    closeMenus();
    navigate(path);
  };

  const markAllRead = () => {
    try {
      localStorage.setItem(
        readStorageKey,
        JSON.stringify(notifications.map((notification) => notification.id)),
      );

      setReadVersion((version) => version + 1);
      window.dispatchEvent(new Event("splitmate-notifications-read"));
    } catch (error) {
      console.error("Unable to save notification status:", error);
    }
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

    closeMenus();
    navigate("/login", { replace: true });
  };

  const notificationIcon = (type) => {
    if (type === "budget") return <Wallet size={16} />;
    if (type === "goal") return <Target size={16} />;
    return <CalendarClock size={16} />;
  };

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/dashboard" && location.pathname.startsWith(`${path}/`));

  return (
    <nav
      className="sm-navbar"
      style={{
        "--nav-card": theme.card,
        "--nav-border": theme.border,
        "--nav-text": theme.text,
        "--nav-secondary": theme.secondary,
        "--nav-primary": theme.primary,
      }}
    >
      <div className="sm-navbar-top">
        <button
          type="button"
          className="sm-brand"
          onClick={() => goTo("/dashboard")}
          aria-label="SplitMate home"
        >
          SplitMate
        </button>

        <button
          type="button"
          className="sm-mobile-toggle"
          aria-label={showMobileNav ? "Close navigation" : "Open navigation"}
          aria-expanded={showMobileNav}
          onClick={() => {
            setShowMobileNav((open) => !open);
            setShowNotifs(false);
            setShowUserMenu(false);
          }}
        >
          {showMobileNav ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={`sm-nav-links ${showMobileNav ? "sm-nav-links-open" : ""}`}
      >
        {navItems.map((item) => {
          const active = isActive(item.path);

          return (
            <button
              type="button"
              key={item.path}
              className={`sm-nav-link ${active ? "is-active" : ""}`}
              onClick={() => goTo(item.path)}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="sm-navbar-actions">
        <button
          type="button"
          className="sm-icon-button"
          aria-label="Toggle theme"
          title="Toggle theme"
          onClick={() => setIsDarkMode(!isDarkMode)}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="sm-menu-anchor">
          <button
            type="button"
            className="sm-icon-button sm-notification-button"
            aria-label="Notifications"
            aria-expanded={showNotifs}
            onClick={() => {
              setShowNotifs((open) => !open);
              setShowUserMenu(false);
              setShowMobileNav(false);
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="sm-notification-count">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="sm-dropdown sm-notifications">
              <div className="sm-dropdown-heading">
                <strong>Notifications</strong>
                <button
                  type="button"
                  className="sm-text-button"
                  onClick={markAllRead}
                >
                  Mark all read
                </button>
              </div>

              {notifications.length === 0 ? (
                <p className="sm-empty-message">No current notifications.</p>
              ) : (
                notifications.map((notification) => {
                  const isRead = readNotificationIds.includes(notification.id);

                  return (
                    <div
                      key={notification.id}
                      className={`sm-notification-item ${
                        isRead ? "" : "is-unread"
                      }`}
                    >
                      <span className="sm-notification-item-icon">
                        {notificationIcon(notification.type)}
                      </span>

                      <div className="sm-notification-copy">
                        <strong>{notification.title}</strong>
                        <p>{notification.message}</p>
                      </div>

                      {!isRead && (
                        <span className="sm-unread-dot" aria-label="Unread" />
                      )}
                    </div>
                  );
                })
              )}

              <button
                type="button"
                className="sm-dropdown-footer"
                onClick={() => goTo("/notifications")}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>

        <div className="sm-menu-anchor">
          <button
            type="button"
            className="sm-profile-button"
            aria-label="Open profile menu"
            aria-expanded={showUserMenu}
            onClick={() => {
              setShowUserMenu((open) => !open);
              setShowNotifs(false);
              setShowMobileNav(false);
            }}
          >
            {userPhoto ? (
              <img className="sm-avatar" src={userPhoto} alt="Profile" />
            ) : (
              <span className="sm-avatar sm-avatar-fallback">
                {userInitial}
              </span>
            )}

            <span className="sm-profile-name">{userName.split(" ")[0]}</span>

            <ChevronDown size={14} />
          </button>

          {showUserMenu && (
            <div className="sm-dropdown sm-user-dropdown">
              <div className="sm-user-details">
                <strong>{userName}</strong>
                <span>{userEmail}</span>
              </div>

              <button
                type="button"
                className="sm-dropdown-action"
                onClick={() => goTo("/settings")}
              >
                Settings
              </button>

              <button
                type="button"
                className="sm-dropdown-action sm-logout"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
