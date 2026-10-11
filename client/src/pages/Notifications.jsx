import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Wallet, Target, CalendarClock, CheckCheck } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { useData } from "../context/DataContext";

export default function Notifications({ isDarkMode, setIsDarkMode }) {
  const navigate = useNavigate();
  const { transactions, budgets, goals, loading } = useData();
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("splitmate-read-notifications") || "[]",
      );
    } catch {
      return [];
    }
  });

  const theme = {
    bg: isDarkMode ? "#0a0f1e" : "#f1f5f9",
    card: isDarkMode ? "#111827" : "#ffffff",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    secondary: isDarkMode ? "#94a3b8" : "#64748b",
    border: isDarkMode ? "#26334b" : "#e2e8f0",
    primary: "#3b82f6",
  };

  const alerts = useMemo(() => {
    const result = [];
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthExpenses = transactions.filter((tx) => {
      const date = new Date(tx.rawDate || tx.date);
      return (
        !Number.isNaN(date.getTime()) &&
        date.getMonth() === month &&
        date.getFullYear() === year &&
        Number(tx.amount) < 0
      );
    });

    const spendingByCategory = {};
    monthExpenses.forEach((tx) => {
      const category = tx.category || "Other";
      spendingByCategory[category] =
        (spendingByCategory[category] || 0) + Math.abs(Number(tx.amount));
    });

    budgets.forEach((budget, index) => {
      const category =
        budget.categoryName ||
        budget.category?.name ||
        budget.category ||
        "Budget";
      const limit = Number(
        budget.limit ?? budget.amount ?? budget.budgetAmount ?? 0,
      );

      if (!limit || !Number.isFinite(limit)) return;

      const spent = spendingByCategory[category] || 0;
      const percent = (spent / limit) * 100;

      if (percent >= 80) {
        result.push({
          id: `budget-${budget._id || budget.id || index}`,
          type: "budget",
          icon: Wallet,
          title: percent >= 100 ? "Budget exceeded" : "Budget almost reached",
          message: `${category}: ${Math.round(percent)}% of the ₹${limit.toLocaleString("en-IN")} limit used.`,
          time: "Based on current-month expenses",
          priority: percent >= 100 ? "high" : "normal",
          path: "/budget",
        });
      }
    });

    goals.forEach((goal, index) => {
      const target = Number(goal.targetAmount ?? goal.target ?? 0);
      const saved = Number(
        goal.savedAmount ?? goal.currentAmount ?? goal.saved ?? 0,
      );

      if (!target || !Number.isFinite(target)) return;

      const percent = Math.min(100, (saved / target) * 100);

      if (percent >= 25) {
        result.push({
          id: `goal-${goal._id || goal.id || index}`,
          type: "goal",
          icon: Target,
          title:
            percent >= 100 ? "Savings goal reached" : "Savings goal progress",
          message: `${goal.name || goal.title || "Your goal"} is ${Math.round(percent)}% complete.`,
          time: "Based on current goal progress",
          priority: "normal",
          path: "/goals",
        });
      }
    });

    // Recurring-payment reminders are not generated here because the
    // exact recurring record schema and due-date fields must be confirmed.
    return result.sort((a, b) =>
      a.priority === "high" && b.priority !== "high" ? -1 : 1,
    );
  }, [transactions, budgets, goals]);

  const markAllRead = () => {
    const ids = alerts.map((alert) => alert.id);
    const next = [...new Set([...readIds, ...ids])];

    setReadIds(next);
    localStorage.setItem("splitmate-read-notifications", JSON.stringify(next));
  };

  const markRead = (id) => {
    const next = [...new Set([...readIds, id])];
    setReadIds(next);
    localStorage.setItem("splitmate-read-notifications", JSON.stringify(next));
  };

  const unreadCount = alerts.filter(
    (alert) => !readIds.includes(alert.id),
  ).length;

  return (
    <div
      style={{ minHeight: "100vh", background: theme.bg, color: theme.text }}
    >
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "32px 20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>
              Notifications
            </h1>
            <p style={{ color: theme.secondary, marginTop: 8 }}>
              {unreadCount} unread · Budget alerts and savings progress
            </p>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              border: `1px solid ${theme.border}`,
              borderRadius: 10,
              background: theme.card,
              color: theme.text,
              cursor: unreadCount ? "pointer" : "default",
            }}
          >
            <CheckCheck size={17} /> Mark all read
          </button>
        </div>

        <section
          style={{
            background: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: 18,
            overflow: "hidden",
          }}
        >
          {loading ? (
            <p style={{ padding: 24, color: theme.secondary }}>
              Loading your financial data...
            </p>
          ) : alerts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "55px 20px" }}>
              <Bell size={35} color={theme.secondary} />
              <h3>No alerts right now</h3>
              <p style={{ color: theme.secondary }}>
                Budget alerts will appear when a category reaches 80% of its
                limit. Savings progress alerts appear when a goal reaches 25%.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const Icon = alert.icon;
              const isRead = readIds.includes(alert.id);

              return (
                <article
                  key={alert.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    padding: 20,
                    borderBottom: `1px solid ${theme.border}`,
                    background: isRead ? "transparent" : `${theme.primary}0b`,
                  }}
                >
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      flexShrink: 0,
                      display: "grid",
                      placeItems: "center",
                      borderRadius: 13,
                      color:
                        alert.priority === "high" ? "#ef4444" : theme.primary,
                      background:
                        alert.priority === "high"
                          ? "#ef444415"
                          : `${theme.primary}15`,
                    }}
                  >
                    <Icon size={20} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>{alert.title}</strong>
                    <p
                      style={{
                        margin: "6px 0",
                        color: theme.secondary,
                        lineHeight: 1.6,
                      }}
                    >
                      {alert.message}
                    </p>
                    <small style={{ color: theme.secondary }}>
                      {alert.time}
                    </small>
                    <div style={{ marginTop: 10 }}>
                      <button
                        type="button"
                        onClick={() => navigate(alert.path)}
                        style={{
                          border: 0,
                          background: "transparent",
                          padding: 0,
                          color: theme.primary,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        View details →
                      </button>
                    </div>
                  </div>

                  {!isRead && (
                    <button
                      type="button"
                      onClick={() => markRead(alert.id)}
                      style={{
                        border: `1px solid ${theme.border}`,
                        background: theme.card,
                        color: theme.secondary,
                        borderRadius: 8,
                        padding: "6px 9px",
                        cursor: "pointer",
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      Mark read
                    </button>
                  )}
                </article>
              );
            })
          )}
        </section>

        <p style={{ color: theme.secondary, fontSize: 12, marginTop: 14 }}>
          Alerts are generated from your current app data. Browser
          notifications, email delivery, and scheduled recurring-payment
          reminders are not enabled.
        </p>
      </main>
    </div>
  );
}
