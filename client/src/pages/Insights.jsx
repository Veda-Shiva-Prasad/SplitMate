import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Target,
  Calendar,
} from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import { useData } from "../context/DataContext";

const Insights = ({ isDarkMode, setIsDarkMode }) => {
  const { transactions, goals, budgets, loading: dataLoading } = useData();
  const [pageLoaded, setPageLoaded] = useState(false);
  const userName = localStorage.getItem("userName") || "User";

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  const totalSpent = (transactions || []).reduce(
    (sum, tx) => sum + Math.abs(tx.amount || 0),
    0,
  );
  const transactionCount = (transactions || []).length;
  const averageSpent = transactionCount > 0 ? totalSpent / transactionCount : 0;

  const categorySpending = {};
  (transactions || []).forEach((tx) => {
    if (tx?.category) {
      categorySpending[tx.category] =
        (categorySpending[tx.category] || 0) + Math.abs(tx.amount || 0);
    }
  });
  const topCategory = Object.entries(categorySpending).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const totalBudget = (budgets || []).reduce(
    (sum, b) => sum + (b.limit || 0),
    0,
  );
  const totalBudgetSpent = (budgets || []).reduce(
    (sum, b) => sum + (b.spent || 0),
    0,
  );
  const budgetHealth =
    totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;

  const activeGoals = (goals || []).filter((g) => !g.archived);
  const completedGoals = activeGoals.filter((g) => g.saved >= g.target).length;
  const goalProgress =
    activeGoals.length > 0 ? (completedGoals / activeGoals.length) * 100 : 0;

  const now = new Date();
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const isInMonth = (tx, year, month) => {
    if (!tx.rawDate) return false;
    const date = new Date(tx.rawDate);
    return date.getFullYear() === year && date.getMonth() === month;
  };

  const currentMonthSpent = (transactions || [])
    .filter((tx) => isInMonth(tx, now.getFullYear(), now.getMonth()))
    .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);

  const lastMonthSpent = (transactions || [])
    .filter((tx) =>
      isInMonth(tx, lastMonthDate.getFullYear(), lastMonthDate.getMonth()),
    )
    .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  const spendingChange =
    lastMonthSpent > 0
      ? ((currentMonthSpent - lastMonthSpent) / lastMonthSpent) * 100
      : 0;

  const insights = [];

  if (totalSpent > 0) {
    insights.push({
      type: "info",
      icon: <TrendingUp size={18} />,
      title: "Spending Summary",
      message: `You've spent ₹${totalSpent.toLocaleString("en-IN")} across ${transactionCount} transactions. Average transaction: ₹${Math.round(averageSpent).toLocaleString("en-IN")}.`,
    });
  }

  if (topCategory) {
    insights.push({
      type: "warning",
      icon: <AlertCircle size={18} />,
      title: "Top Spending Category",
      message: `Your highest spending category is ${topCategory[0]} with ₹${topCategory[1].toLocaleString("en-IN")} (${Math.round((topCategory[1] / totalSpent) * 100)}% of total).`,
    });
  }

  if (budgetHealth > 80) {
    insights.push({
      type: "danger",
      icon: <AlertCircle size={18} />,
      title: "Budget Alert",
      message: `You've used ${Math.round(budgetHealth)}% of your total budget. Consider reducing spending in over-budget categories.`,
    });
  } else if (budgetHealth > 0) {
    insights.push({
      type: "success",
      icon: <TrendingDown size={18} />,
      title: "Budget Health",
      message: `You're on track with your budget! Used only ${Math.round(budgetHealth)}% of your total budget.`,
    });
  }

  if (spendingChange > 20) {
    insights.push({
      type: "warning",
      icon: <TrendingUp size={18} />,
      title: "Spending Increase",
      message: `Your spending is up ${Math.round(spendingChange)}% compared to last month. Review your expenses to stay on track.`,
    });
  } else if (spendingChange < -20) {
    insights.push({
      type: "success",
      icon: <TrendingDown size={18} />,
      title: "Great Progress!",
      message: `Your spending decreased by ${Math.abs(Math.round(spendingChange))}% compared to last month. Keep it up!`,
    });
  }

  if (activeGoals.length > 0) {
    insights.push({
      type: "info",
      icon: <Target size={18} />,
      title: "Goal Progress",
      message: `You've completed ${completedGoals} out of ${activeGoals.length} goals (${Math.round(goalProgress)}% completion rate).`,
    });
  }

  if (transactions.length === 0) {
    insights.push({
      type: "info",
      icon: <Calendar size={18} />,
      title: "Get Started",
      message:
        "Start adding your expenses to get personalized insights and recommendations!",
    });
  }

  const getInsightColor = (type) => {
    switch (type) {
      case "success":
        return "#10B981";
      case "warning":
        return "#F59E0B";
      case "danger":
        return "#F43F5E";
      default:
        return "#3B82F6";
    }
  };

  const theme = {
    bg: isDarkMode ? "#0A0F1E" : "#F1F5F9",
    card: isDarkMode ? "#111827" : "#FFFFFF",
    border: isDarkMode ? "#1E2D45" : "#E2E8F0",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    secondary: isDarkMode ? "#94A3B8" : "#64748B",
    primary: "#3B82F6",
  };

  if (dataLoading) {
    return (
      <div
        style={{
          backgroundColor: theme.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            color: theme.text,
            fontSize: "18px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Loading insights...
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        minHeight: "100vh",
        color: theme.text,
        opacity: pageLoaded ? 1 : 0,
        transform: pageLoaded ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      <main style={{ padding: "36px 40px" }}>
        <div className="animate-fadeInUp" style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "800",
              margin: 0,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            AI Insights
          </h1>
          <p
            style={{
              color: theme.secondary,
              margin: "4px 0 0 0",
              fontSize: "14px",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Personalized financial analysis for {userName.split(" ")[0]}
          </p>
        </div>

        <div
          className="stagger-children"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginBottom: "28px",
          }}
        >
          {[
            {
              label: "Total Spent",
              value: `₹${totalSpent.toLocaleString("en-IN")}`,
              change: spendingChange,
              icon: <TrendingUp size={20} />,
            },
            {
              label: "Transactions",
              value: transactionCount,
              change: null,
              icon: <Calendar size={20} />,
            },
            {
              label: "Goals Completed",
              value: `${completedGoals}/${activeGoals.length}`,
              change: null,
              icon: <Target size={20} />,
            },
          ].map((metric) => (
            <div
              key={metric.label}
              className="hover-lift"
              style={{
                backgroundColor: theme.card,
                padding: "24px",
                borderRadius: "16px",
                border: `1px solid ${theme.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "12px",
                }}
              >
                <p
                  style={{
                    color: theme.secondary,
                    margin: 0,
                    fontSize: "12px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {metric.label}
                </p>
                <div style={{ color: theme.secondary }}>{metric.icon}</div>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "28px",
                  color: theme.primary,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {metric.value}
              </h2>
              {metric.change !== null && (
                <p
                  style={{
                    margin: "8px 0 0 0",
                    fontSize: "12px",
                    color: metric.change > 0 ? "#F43F5E" : "#10B981",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {metric.change > 0 ? "↑" : "↓"}{" "}
                  {Math.abs(Math.round(metric.change))}% from last month
                </p>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {insights.map((insight, index) => (
            <div
              key={index}
              className="animate-fadeInUp"
              style={{
                backgroundColor: theme.card,
                padding: "24px",
                borderRadius: "20px",
                border: `1px solid ${theme.border}`,
                borderLeft: `4px solid ${getInsightColor(insight.type)}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div style={{ color: getInsightColor(insight.type) }}>
                  {insight.icon}
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: "16px",
                    fontWeight: "800",
                    color: getInsightColor(insight.type),
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {insight.title}
                </h3>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  lineHeight: "1.6",
                  color: theme.text,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {insight.message}
              </p>
            </div>
          ))}
        </div>

        {totalSpent > 0 && (
          <div
            className="animate-fadeInUp"
            style={{
              marginTop: "28px",
              background: "linear-gradient(135deg, #1E3A5F 0%, #0A0F1E 100%)",
              padding: "28px",
              borderRadius: "20px",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                color: "white",
                fontWeight: "800",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              AI Recommendations
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {budgetHealth > 80 && (
                <p
                  style={{
                    margin: 0,
                    color: "#F1F5F9",
                    fontSize: "14px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  💡 Consider setting stricter budget limits for categories
                  where you're overspending.
                </p>
              )}
              {spendingChange > 20 && (
                <p
                  style={{
                    margin: 0,
                    color: "#F1F5F9",
                    fontSize: "14px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  💡 Your spending increased significantly this month. Review
                  your recent transactions to identify areas for reduction.
                </p>
              )}
              {activeGoals.length === 0 && (
                <p
                  style={{
                    margin: 0,
                    color: "#F1F5F9",
                    fontSize: "14px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  💡 Set up a savings goal to start working towards your
                  financial dreams!
                </p>
              )}
              {transactionCount > 0 && averageSpent > 5000 && (
                <p
                  style={{
                    margin: 0,
                    color: "#F1F5F9",
                    fontSize: "14px",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  💡 Your average transaction is high. Consider tracking smaller
                  expenses to better understand your spending patterns.
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Insights;
