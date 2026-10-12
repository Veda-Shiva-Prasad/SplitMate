import React, { useMemo, useState } from "react";
import { Bell, CheckCheck, CalendarClock, Target, Wallet } from "lucide-react";
import { useData } from "../context/DataContext";
import { buildNotifications } from "../utils/notifications";
import Navbar from "../components/Navbar.jsx";

const readNotifications = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const Notifications = ({ isDarkMode = false, setIsDarkMode }) => {
  const { transactions, budgets, goals, recurring, loading } = useData();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();

  const userKey =
    user._id || user.id || localStorage.getItem("userEmail") || "guest";
  const storageKey = `splitmate-read-notifications-${userKey}`;

  const [readIds, setReadIds] = useState(() => readNotifications(storageKey));

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

  const unreadCount = notifications.filter(
    (notification) => !readIds.includes(notification.id),
  ).length;

  const markAllRead = () => {
    const next = notifications.map((notification) => notification.id);
    setReadIds(next);

    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch (error) {
      console.error("Unable to save notification read status:", error);
    }
  };

  const theme = {
    background: isDarkMode ? "#0a0f1e" : "#f1f5f9",
    card: isDarkMode ? "#111827" : "#ffffff",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    secondary: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#26334b" : "#e2e8f0",
    primary: "#3b82f6",
  };

  const iconFor = (type) => {
    if (type === "budget") return <Wallet size={19} />;
    if (type === "goal") return <Target size={19} />;
    return <CalendarClock size={19} />;
  };

  return (
    <>
      <Navbar
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode || (() => {})}
      />

      <main
        style={{
          minHeight: "calc(100vh - 70px)",
          padding: "28px 20px",
          background: theme.background,
          color: theme.text,
        }}
      >
        <section style={{ maxWidth: 900, margin: "0 auto" }}>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: 28 }}>Notifications</h1>
              <p style={{ color: theme.secondary, marginBottom: 0 }}>
                Budget updates, savings progress, and upcoming payments.
              </p>
            </div>

            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                border: `1px solid ${theme.border}`,
                borderRadius: 10,
                background: theme.card,
                color: theme.primary,
                cursor: unreadCount ? "pointer" : "not-allowed",
                opacity: unreadCount ? 1 : 0.6,
              }}
            >
              <CheckCheck size={17} />
              Mark all read
            </button>
          </header>

          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: "14px 18px",
                flex: "1 1 180px",
              }}
            >
              <div style={{ color: theme.secondary, fontSize: 13 }}>
                Total notifications
              </div>
              <strong style={{ fontSize: 24 }}>{notifications.length}</strong>
            </div>

            <div
              style={{
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 12,
                padding: "14px 18px",
                flex: "1 1 180px",
              }}
            >
              <div style={{ color: theme.secondary, fontSize: 13 }}>Unread</div>
              <strong style={{ fontSize: 24 }}>{unreadCount}</strong>
            </div>
          </div>

          {loading ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: theme.secondary,
              }}
            >
              Loading your notifications…
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{
                padding: 36,
                textAlign: "center",
                background: theme.card,
                border: `1px solid ${theme.border}`,
                borderRadius: 16,
              }}
            >
              <Bell
                size={34}
                color={theme.secondary}
                style={{ marginBottom: 12 }}
              />
              <h3 style={{ margin: "0 0 8px" }}>You're all caught up</h3>
              <p style={{ color: theme.secondary, margin: 0 }}>
                Notifications will appear here when a budget is nearing its
                limit, a goal makes progress, or a recurring payment is due
                within seven days.
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {notifications.map((notification) => {
                const isRead = readIds.includes(notification.id);

                return (
                  <article
                    key={notification.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                      padding: 18,
                      borderRadius: 14,
                      border: `1px solid ${theme.border}`,
                      background: theme.card,
                      opacity: isRead ? 0.75 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: `${theme.primary}18`,
                        color: theme.primary,
                        flexShrink: 0,
                      }}
                    >
                      {iconFor(notification.type)}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          gap: 10,
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>
                          {notification.title}
                        </h3>
                        {!isRead && (
                          <span
                            aria-label="Unread"
                            style={{
                              width: 8,
                              height: 8,
                              marginTop: 5,
                              borderRadius: "50%",
                              background: theme.primary,
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>

                      <p
                        style={{
                          color: theme.secondary,
                          margin: 0,
                          lineHeight: 1.5,
                          fontSize: 14,
                        }}
                      >
                        {notification.message}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
};

export default Notifications;
