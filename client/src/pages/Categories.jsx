import React, { useState, useEffect } from "react";
import { Trash2, Plus, X } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import Navbar from "../components/Navbar.jsx";
import API from "../utils/api";
import { useData } from "../context/DataContext";

const CATEGORY_COLORS = {
  Food: "#F59E0B",
  Transport: "#3B82F6",
  Bills: "#8B5CF6",
  Entertainment: "#EC4899",
  Health: "#10B981",
  Shopping: "#F43F5E",
  Other: "#94A3B8",
};

const categoryIcons = {
  Food: "🍔",
  Transport: "🚗",
  Bills: "⚡",
  Entertainment: "🎬",
  Health: "💊",
  Shopping: "🛒",
  Other: "📦",
};

const formatCurrency = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const Categories = ({ isDarkMode, setIsDarkMode }) => {
  const { transactions = [], refreshData } = useData();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    limit: "",
    color: "#3B82F6",
    icon: "📦",
  });
  const [customCategories, setCustomCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCustomCategories();
  }, []);

  const fetchCustomCategories = async () => {
    try {
      const response = await API.get("/categories");
      setCustomCategories(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
      setError(
        err.response?.data?.message || "Could not load custom categories.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions to the current calendar month.
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const currentMonthTransactions = (transactions || []).filter((tx) => {
    const rawDate = tx.rawDate || tx.date;
    if (!rawDate) return false;

    const date = new Date(rawDate);
    if (Number.isNaN(date.getTime())) return false;

    return (
      date.getFullYear() === currentYear && date.getMonth() === currentMonth
    );
  });

  const categorySpending = {};

  currentMonthTransactions.forEach((tx) => {
    const category = tx.category || "Other";
    categorySpending[category] =
      (categorySpending[category] || 0) + Math.abs(Number(tx.amount) || 0);
  });

  const allCategories = [
    ...Object.keys(CATEGORY_COLORS),
    ...customCategories.map((category) => category.name),
  ];

  const pieData = allCategories
    .filter((category, index, list) => list.indexOf(category) === index)
    .map((category) => {
      const custom = customCategories.find((item) => item.name === category);

      return {
        name: category,
        value: categorySpending[category] || 0,
        color: CATEGORY_COLORS[category] || custom?.color || "#94A3B8",
        icon: categoryIcons[category] || custom?.icon || "📦",
      };
    })
    .filter((item) => item.value > 0);

  const theme = {
    bg: isDarkMode ? "#0A0F1E" : "#F1F5F9",
    card: isDarkMode ? "#111827" : "#FFFFFF",
    border: isDarkMode ? "#1E2D45" : "#E2E8F0",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    secondary: isDarkMode ? "#94A3B8" : "#64748B",
    primary: "#3B82F6",
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 16px",
    background: theme.bg,
    border: `1px solid ${theme.border}`,
    borderRadius: "12px",
    color: theme.text,
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    marginTop: "8px",
    fontFamily: "'Inter', sans-serif",
  };

  const handleAddCategory = async () => {
    const name = form.name.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    if (
      form.limit &&
      (!Number.isFinite(Number(form.limit)) || Number(form.limit) <= 0)
    ) {
      setError("Budget limit must be a positive number.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await API.post("/categories", {
        name,
        limit: form.limit ? Number(form.limit) : null,
        color: form.color,
        icon: form.icon.trim() || "📦",
      });

      setShowModal(false);
      setForm({
        name: "",
        limit: "",
        color: "#3B82F6",
        icon: "📦",
      });

      await fetchCustomCategories();
      if (refreshData) await refreshData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not add the category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Delete the custom category "${category.name}"?`)) {
      return;
    }

    setError("");

    try {
      await API.delete(`/categories/${encodeURIComponent(category.name)}`);

      await fetchCustomCategories();
      if (refreshData) await refreshData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete the category.");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: theme.bg,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: theme.text,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Loading categories...
      </div>
    );
  }

  const cardStyle = {
    backgroundColor: theme.card,
    padding: "24px",
    borderRadius: "20px",
    border: `1px solid ${theme.border}`,
    minWidth: 0,
  };

  const buttonStyle = {
    background: theme.primary,
    color: "#fff",
    border: "none",
    padding: "12px 18px",
    borderRadius: "10px",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };

  const renderCategoryCard = (category, isCustom = false) => {
    const name = isCustom ? category.name : category;
    const color = isCustom
      ? category.color || "#94A3B8"
      : CATEGORY_COLORS[category];
    const icon = isCustom ? category.icon || "📦" : categoryIcons[category];
    const spent = categorySpending[name] || 0;
    const limit = Number(category.limit) || 0;
    const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

    return (
      <div
        key={isCustom ? category._id || category.name : category}
        style={{
          ...cardStyle,
          padding: "20px",
          borderRadius: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "14px",
          }}
        >
          <span style={{ fontSize: "30px" }}>{icon}</span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 800 }}>
              {name}
            </h3>
            <p
              style={{
                margin: "3px 0 0",
                fontSize: "12px",
                color: theme.secondary,
              }}
            >
              {isCustom ? "Custom Category" : "Default Category"}
            </p>
          </div>

          {isCustom && (
            <button
              type="button"
              aria-label={`Delete ${name}`}
              title={`Delete ${name}`}
              onClick={() => handleDeleteCategory(category)}
              style={{
                background: "#F43F5E20",
                border: "none",
                color: "#F43F5E",
                width: "34px",
                height: "34px",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: "10px",
          }}
        >
          <strong style={{ fontSize: "20px", color }}>
            {formatCurrency(spent)}
          </strong>
          <span
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: color,
              flexShrink: 0,
            }}
          />
        </div>

        {limit > 0 && (
          <div style={{ marginTop: "14px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
                fontSize: "12px",
                color: theme.secondary,
                marginBottom: "6px",
              }}
            >
              <span>Budget limit</span>
              <span>{formatCurrency(limit)}</span>
            </div>
            <div
              style={{
                height: "6px",
                background: theme.border,
                borderRadius: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${percentage}%`,
                  height: "100%",
                  background: spent > limit ? "#F43F5E" : color,
                }}
              />
            </div>
          </div>
        )}

        <p
          style={{
            margin: "12px 0 0",
            fontSize: "12px",
            color: theme.secondary,
          }}
        >
          Spent in {now.toLocaleDateString("en-IN", { month: "long" })}
        </p>
      </div>
    );
  };

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        minHeight: "100vh",
        color: theme.text,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main style={{ padding: "32px clamp(16px, 3vw, 40px)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 800, margin: 0 }}>
              Categories
            </h1>
            <p
              style={{
                color: theme.secondary,
                margin: "5px 0 0",
                fontSize: "14px",
              }}
            >
              Manage your expense categories
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setShowModal(true);
            }}
            style={buttonStyle}
          >
            <Plus size={18} /> Add Category
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "12px 16px",
              marginBottom: "18px",
              borderRadius: "10px",
              border: "1px solid #F43F5E55",
              color: theme.text,
              background: "#F43F5E12",
            }}
          >
            {error}
            <button
              type="button"
              onClick={() => setError("")}
              style={{
                float: "right",
                border: 0,
                background: "transparent",
                color: theme.text,
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 380px), 1fr))",
            gap: "24px",
            marginBottom: "24px",
          }}
        >
          <section style={cardStyle}>
            <h3 style={{ margin: "0 0 20px" }}>Spending by Category</h3>
            <div style={{ height: "300px" }}>
              {pieData.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    color: theme.secondary,
                  }}
                >
                  No expenses recorded this month.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={85}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Spent"]}
                      contentStyle={{
                        backgroundColor: theme.card,
                        border: `1px solid ${theme.border}`,
                        borderRadius: "10px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          <section style={cardStyle}>
            <h3 style={{ margin: "0 0 20px" }}>Category Comparison</h3>
            <div style={{ height: "300px" }}>
              {pieData.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                    color: theme.secondary,
                  }}
                >
                  No expenses recorded this month.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pieData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={theme.border}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      stroke={theme.secondary}
                      fontSize={12}
                    />
                    <YAxis
                      stroke={theme.secondary}
                      fontSize={11}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), "Spent"]}
                      contentStyle={{
                        backgroundColor: theme.card,
                        border: `1px solid ${theme.border}`,
                        borderRadius: "10px",
                      }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 230px), 1fr))",
            gap: "18px",
          }}
        >
          {Object.keys(CATEGORY_COLORS).map((category) =>
            renderCategoryCard(category),
          )}

          {customCategories.map((category) =>
            renderCategoryCard(category, true),
          )}
        </div>
      </main>

      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            zIndex: 1000,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-modal-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              background: theme.card,
              borderRadius: "20px",
              padding: "28px",
              width: "420px",
              maxWidth: "100%",
              border: `1px solid ${theme.border}`,
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                marginBottom: "24px",
              }}
            >
              <h3
                id="category-modal-title"
                style={{ margin: 0, fontSize: "20px" }}
              >
                Add Custom Category
              </h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setShowModal(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: theme.secondary,
                  cursor: "pointer",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <label>
              <span
                style={{ display: "block", fontSize: "13px", fontWeight: 700 }}
              >
                Category Name
              </span>
              <input
                type="text"
                maxLength={60}
                placeholder="e.g. Travel"
                value={form.name}
                onChange={(event) =>
                  setForm({ ...form, name: event.target.value })
                }
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginTop: "18px" }}>
              <span
                style={{ display: "block", fontSize: "13px", fontWeight: 700 }}
              >
                Budget Limit (Optional)
              </span>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5000"
                value={form.limit}
                onChange={(event) =>
                  setForm({ ...form, limit: event.target.value })
                }
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", marginTop: "18px" }}>
              <span
                style={{ display: "block", fontSize: "13px", fontWeight: 700 }}
              >
                Color
              </span>
              <input
                type="color"
                value={form.color}
                onChange={(event) =>
                  setForm({ ...form, color: event.target.value })
                }
                style={{
                  ...inputStyle,
                  height: "48px",
                  padding: "5px",
                  cursor: "pointer",
                }}
              />
            </label>

            <label style={{ display: "block", marginTop: "18px" }}>
              <span
                style={{ display: "block", fontSize: "13px", fontWeight: 700 }}
              >
                Icon (Emoji)
              </span>
              <input
                type="text"
                maxLength={8}
                placeholder="e.g. ✈️"
                value={form.icon}
                onChange={(event) =>
                  setForm({ ...form, icon: event.target.value })
                }
                style={inputStyle}
              />
            </label>

            <button
              type="button"
              disabled={saving}
              onClick={handleAddCategory}
              style={{
                ...buttonStyle,
                width: "100%",
                marginTop: "24px",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Saving..." : "Add Category"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
