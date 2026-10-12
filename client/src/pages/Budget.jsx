import React, { useState, useEffect } from "react";

import { Edit2, Trash2, Plus, X } from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

import Navbar from "../components/Navbar.jsx";

import API from "../utils/api";

const CATEGORY_COLORS = {
  Food: "#F59E0B",

  Transport: "#3B82F6",

  Bills: "#8B5CF6",

  Entertainment: "#EC4899",

  Health: "#10B981",

  Shopping: "#F43F5E",

  Other: "#94A3B8",
};

const Budget = ({ isDarkMode, setIsDarkMode }) => {
  const [budgets, setBudgets] = useState([]);

  const [monthlyLimit, setMonthlyLimit] = useState(20000);

  const [showModal, setShowModal] = useState(false);

  const [showLimitModal, setShowLimitModal] = useState(false);

  const [editItem, setEditItem] = useState(null);

  const [form, setForm] = useState({ category: "Food", limit: "" });

  const [newLimit, setNewLimit] = useState("");

  const [carryOver, setCarryOver] = useState(false);

  const [loading, setLoading] = useState(true);

  const [savingLimit, setSavingLimit] = useState(false);

  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);

    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [budgetsRes, expensesRes] = await Promise.all([
        API.get("/budgets"),
        API.get("/expenses"),
      ]);
      const now = new Date();
      const currentExpenses = (expensesRes.data || []).filter((tx) => {
        const dt = new Date(tx.rawDate);
        return (
          !Number.isNaN(dt.getTime()) &&
          dt.getFullYear() === now.getFullYear() &&
          dt.getMonth() === now.getMonth()
        );
      });
      setMonthlySpent(
        currentExpenses.reduce(
          (sum, tx) => sum + Math.abs(Number(tx.amount) || 0),
          0,
        ),
      );

      setBudgets(budgetsRes.data);

      const limitRes = await API.get("/budgets/limit");

      const limit = limitRes.data?.limit || 20000;

      setMonthlyLimit(limit);

      setNewLimit(limit);
    } catch (error) {
      console.error("Error fetching budgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditItem(null);

    setForm({ category: "Food", limit: "" });

    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);

    setForm({ category: item.category, limit: item.limit });

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/budgets/${id}`);

      fetchData();
    } catch (error) {
      console.error("Error deleting budget:", error);
    }
  };

  const handleSave = async () => {
    if (!form.limit) return;

    try {
      await API.post("/budgets", {
        category: form.category,

        limit: +form.limit,
      });

      setShowModal(false);

      fetchData();
    } catch (error) {
      console.error("Error saving budget:", error);
    }
  };

  const handleSaveLimit = async () => {
    if (!newLimit || isNaN(newLimit) || +newLimit <= 0) {
      alert("Please enter a valid amount");

      return;
    }

    setSavingLimit(true);

    try {
      await API.put("/budgets/limit", { limit: +newLimit });

      setMonthlyLimit(+newLimit);

      setShowLimitModal(false);

      await fetchData();

      alert(`Budget limit updated to ₹${(+newLimit).toLocaleString("en-IN")}`);
    } catch (error) {
      console.error("Error updating limit:", error);

      alert("Failed to update budget limit. Please try again.");
    } finally {
      setSavingLimit(false);
    }
  };

  const [monthlySpent, setMonthlySpent] = useState(0);
  const totalSpent = monthlySpent;

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

    transition: "all 0.2s ease",
  };

  const historyData =
    budgets.length > 0
      ? [
          {
            month: "This Month",

            ...Object.fromEntries(budgets.map((b) => [b.category, b.spent])),
          },
        ]
      : [{ month: "No Data", amount: 0 }];

  if (loading) {
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
          Loading budgets...
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

      <main
        style={{
          width: "100%",
          maxWidth: 1800,
          margin: "0 auto",
          padding: "clamp(16px, 4vw, 36px) clamp(12px, 4vw, 40px)",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >
        <div
          style={{
            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            marginBottom: "28px",
          }}
        >
          <div className="animate-fadeInUp">
            <h1
              style={{
                fontSize: "28px",

                fontWeight: "800",

                margin: 0,

                fontFamily: "'Inter', sans-serif",
              }}
            >
              Budget Planner
            </h1>

            <p
              style={{
                color: theme.secondary,

                margin: "4px 0 0 0",

                fontSize: "14px",

                fontFamily: "'Inter', sans-serif",
              }}
            >
              Manage and track your monthly spending limits
            </p>
          </div>

          <button
            onClick={openAdd}
            className="hover-glow"
            style={{
              backgroundColor: theme.primary,

              color: "white",

              border: "none",

              padding: "12px 22px",

              borderRadius: "12px",

              fontWeight: "bold",

              cursor: "pointer",

              display: "flex",

              alignItems: "center",

              gap: "8px",

              fontFamily: "'Inter', sans-serif",

              transition: "all 0.2s ease",
            }}
          >
            <Plus size={18} /> Add Budget
          </button>
        </div>

        {/* Overall Budget Card */}

        <div
          className="animate-scaleIn"
          style={{
            backgroundColor: theme.card,

            padding: "28px",

            borderRadius: "20px",

            border: `1px solid ${theme.border}`,

            marginBottom: "24px",
          }}
        >
          <div
            style={{
              display: "flex",

              justifyContent: "space-between",

              alignItems: "flex-start",

              marginBottom: "20px",

              flexWrap: "wrap",

              gap: "16px",
            }}
          >
            <div>
              <p
                style={{
                  color: theme.secondary,

                  margin: "0 0 4px 0",

                  fontSize: "13px",

                  fontWeight: "700",

                  fontFamily: "'Inter', sans-serif",
                }}
              >
                OVERALL MONTHLY BUDGET
              </p>

              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <h2
                  style={{
                    margin: 0,

                    fontSize: "32px",

                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  ₹{(totalSpent || 0).toLocaleString("en-IN")}{" "}
                  <span style={{ color: theme.secondary, fontSize: "18px" }}>
                    / ₹{(monthlyLimit || 0).toLocaleString("en-IN")}
                  </span>
                </h2>

                <button
                  onClick={() => {
                    setNewLimit(monthlyLimit);

                    setShowLimitModal(true);
                  }}
                  className="hover-scale"
                  style={{
                    background: `${theme.primary}20`,

                    color: theme.primary,

                    border: `1px solid ${theme.primary}40`,

                    padding: "6px 14px",

                    borderRadius: "8px",

                    cursor: "pointer",

                    fontWeight: "700",

                    fontSize: "12px",

                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  ✏️ Change Limit
                </button>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <span
                style={{
                  fontSize: "13px",

                  color: theme.secondary,

                  fontWeight: "600",

                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Carry-over (not yet available)
              </span>

              <div
                onClick={() => alert("Carry-over is not available yet.")}
                style={{
                  width: "48px",

                  height: "26px",

                  borderRadius: "13px",

                  background: carryOver ? theme.primary : theme.border,

                  cursor: "pointer",

                  position: "relative",

                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    width: "20px",

                    height: "20px",

                    borderRadius: "50%",

                    background: "white",

                    position: "absolute",

                    top: "3px",

                    left: carryOver ? "25px" : "3px",

                    transition: "left 0.2s",
                  }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              height: "10px",

              background: theme.border,

              borderRadius: "10px",
            }}
          >
            <div
              style={{
                width: `${Math.min(((totalSpent || 0) / (monthlyLimit || 1)) * 100, 100)}%`,

                height: "100%",

                background:
                  (totalSpent || 0) / (monthlyLimit || 1) > 0.8
                    ? "#F43F5E"
                    : theme.primary,

                borderRadius: "10px",

                transition: "width 0.8s ease",
              }}
            />
          </div>

          <p
            style={{
              color: theme.secondary,

              fontSize: "13px",

              margin: "8px 0 0 0",

              fontFamily: "'Inter', sans-serif",
            }}
          >
            {Math.round(((totalSpent || 0) / (monthlyLimit || 1)) * 100)}% used
            — ₹
            {((monthlyLimit || 0) - (totalSpent || 0)).toLocaleString("en-IN")}{" "}
            remaining
          </p>
        </div>

        {/* Budget Cards */}

        {budgets.length === 0 ? (
          <div
            className="animate-fadeInUp"
            style={{
              backgroundColor: theme.card,

              padding: "60px",

              borderRadius: "20px",

              border: `1px solid ${theme.border}`,

              textAlign: "center",

              marginBottom: "24px",
            }}
          >
            <p style={{ fontSize: "40px", margin: "0 0 12px 0" }}>💰</p>

            <h3
              style={{
                margin: "0 0 8px 0",

                fontWeight: "700",

                fontFamily: "'Inter', sans-serif",
              }}
            >
              No budgets set yet
            </h3>

            <p
              style={{
                color: theme.secondary,

                margin: "0 0 20px 0",

                fontSize: "14px",

                fontFamily: "'Inter', sans-serif",
              }}
            >
              Click "Add Budget" to create your first budget category
            </p>

            <button
              onClick={openAdd}
              className="hover-glow"
              style={{
                backgroundColor: theme.primary,

                color: "white",

                border: "none",

                padding: "12px 24px",

                borderRadius: "12px",

                fontWeight: "bold",

                cursor: "pointer",

                fontFamily: "'Inter', sans-serif",
              }}
            >
              + Add Your First Budget
            </button>
          </div>
        ) : (
          <div
            className="stagger-children"
            style={{
              display: "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              width: "100%",
              minWidth: 0,

              gap: "20px",

              marginBottom: "28px",
            }}
          >
            {budgets.map((b) => {
              const pct = Math.round(((b.spent || 0) / (b.limit || 1)) * 100);

              const exceeded = pct > 100;

              const warning = pct > 80 && !exceeded;

              return (
                <div
                  key={b._id}
                  className="hover-lift"
                  style={{
                    backgroundColor: theme.card,

                    padding: "24px",

                    borderRadius: "16px",

                    border: `1px solid ${exceeded ? "#F43F5E60" : warning ? "#F59E0B40" : theme.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",

                      justifyContent: "space-between",

                      alignItems: "flex-start",

                      marginBottom: "16px",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",

                          alignItems: "center",

                          gap: "8px",

                          marginBottom: "4px",
                        }}
                      >
                        <div
                          style={{
                            width: "10px",

                            height: "10px",

                            borderRadius: "50%",

                            background: CATEGORY_COLORS[b.category],
                          }}
                        />

                        <h3
                          style={{
                            margin: 0,

                            fontSize: "16px",

                            fontWeight: "700",

                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {b.category}
                        </h3>

                        {exceeded && (
                          <span
                            style={{
                              background: "#F43F5E20",

                              color: "#F43F5E",

                              fontSize: "11px",

                              padding: "2px 8px",

                              borderRadius: "20px",

                              fontWeight: "700",

                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Exceeded!
                          </span>
                        )}

                        {warning && (
                          <span
                            style={{
                              background: "#F59E0B20",

                              color: "#F59E0B",

                              fontSize: "11px",

                              padding: "2px 8px",

                              borderRadius: "20px",

                              fontWeight: "700",

                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            Warning
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          margin: 0,

                          color: theme.secondary,

                          fontSize: "13px",

                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        ₹{(b.spent || 0).toLocaleString()} of ₹
                        {(b.limit || 0).toLocaleString()} spent
                      </p>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => openEdit(b)}
                        className="hover-scale"
                        style={{
                          background: `${theme.primary}20`,

                          border: "none",

                          color: theme.primary,

                          width: "32px",

                          height: "32px",

                          borderRadius: "8px",

                          cursor: "pointer",

                          display: "flex",

                          alignItems: "center",

                          justifyContent: "center",
                        }}
                      >
                        <Edit2 size={14} />
                      </button>

                      <button
                        onClick={() => handleDelete(b._id)}
                        className="hover-scale"
                        style={{
                          background: "#F43F5E20",

                          border: "none",

                          color: "#F43F5E",

                          width: "32px",

                          height: "32px",

                          borderRadius: "8px",

                          cursor: "pointer",

                          display: "flex",

                          alignItems: "center",

                          justifyContent: "center",
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      height: "8px",

                      background: theme.border,

                      borderRadius: "10px",
                    }}
                  >
                    <div
                      style={{
                        width: `${Math.min(pct, 100)}%`,

                        height: "100%",

                        background: exceeded
                          ? "#F43F5E"
                          : warning
                            ? "#F59E0B"
                            : CATEGORY_COLORS[b.category],

                        borderRadius: "10px",

                        transition: "width 0.8s ease",
                      }}
                    />
                  </div>

                  <p
                    style={{
                      margin: "8px 0 0 0",

                      fontSize: "12px",

                      color: exceeded ? "#F43F5E" : theme.secondary,

                      fontWeight: exceeded ? "700" : "400",

                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {pct}% used
                    {exceeded
                      ? ` — ₹${((b.spent || 0) - (b.limit || 0)).toLocaleString()} over budget`
                      : ` — ₹${((b.limit || 0) - (b.spent || 0)).toLocaleString()} remaining`}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* History Chart */}

        {budgets.length > 0 && (
          <div
            className="animate-fadeInUp"
            style={{
              backgroundColor: theme.card,

              padding: "28px",

              borderRadius: "20px",

              border: `1px solid ${theme.border}`,
            }}
          >
            <h3
              style={{
                margin: "0 0 24px 0",

                fontWeight: "700",

                fontFamily: "'Inter', sans-serif",
              }}
            >
              Budget Overview by Category
            </h3>

            <div style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={historyData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.border}
                    vertical={false}
                  />

                  <XAxis
                    dataKey="month"
                    stroke={theme.secondary}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />

                  <YAxis
                    stroke={theme.secondary}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v / 1000}k`}
                  />

                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme.card,

                      border: `1px solid ${theme.border}`,

                      borderRadius: "10px",

                      fontFamily: "'Inter', sans-serif",
                    }}
                    formatter={(v) => [`₹${v}`, ""]}
                  />

                  <Legend />

                  {budgets.map((b) => (
                    <Bar
                      key={b.category}
                      dataKey={b.category}
                      fill={CATEGORY_COLORS[b.category]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </main>

      {/* Add/Edit Budget Modal */}

      {showModal && (
        <div
          style={{
            position: "fixed",

            inset: 0,

            background: "rgba(0, 0, 0, 0.6)",

            backdropFilter: "blur(4px)",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            padding: 12,

            boxSizing: "border-box",

            overflowY: "auto",

            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="animate-scaleIn"
            style={{
              background: theme.card,

              borderRadius: "24px",

              padding: "clamp(18px, 5vw, 32px)",

              width: "min(420px, calc(100vw - 24px))",

              maxWidth: "100%",
              maxHeight: "calc(100dvh - 24px)",
              overflowY: "auto",
              boxSizing: "border-box",
              minWidth: 0,

              border: `1px solid ${theme.border}`,

              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  margin: 0,

                  fontWeight: "800",

                  fontSize: "20px",

                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {editItem ? "Edit Budget" : "Add Budget"}
              </h3>

              <button
                onClick={() => setShowModal(false)}
                className="hover-scale"
                style={{
                  background: "none",

                  border: "none",

                  color: theme.secondary,

                  cursor: "pointer",

                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "13px",

                  fontWeight: "700",

                  marginBottom: "8px",

                  display: "block",

                  color: theme.secondary,

                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Category
              </label>

              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="hover-lift"
                style={inputStyle}
              >
                {[
                  "Food",

                  "Transport",

                  "Bills",

                  "Entertainment",

                  "Health",

                  "Shopping",

                  "Other",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  fontSize: "13px",

                  fontWeight: "700",

                  marginBottom: "8px",

                  display: "block",

                  color: theme.secondary,

                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Budget Limit (₹)
              </label>

              <input
                type="number"
                placeholder="e.g. 5000"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
                className="hover-lift"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleSave}
              className="hover-glow"
              style={{
                width: "100%",

                background: theme.primary,

                color: "white",

                border: "none",

                padding: "14px",

                borderRadius: "12px",

                fontWeight: "bold",

                fontSize: "15px",

                cursor: "pointer",

                fontFamily: "'Inter', sans-serif",
              }}
            >
              {editItem ? "Save Changes" : "Add Budget"}
            </button>
          </div>
        </div>
      )}

      {/* Change Monthly Limit Modal */}

      {showLimitModal && (
        <div
          style={{
            position: "fixed",

            inset: 0,

            background: "rgba(0, 0, 0, 0.6)",

            backdropFilter: "blur(4px)",

            display: "flex",

            alignItems: "center",

            justifyContent: "center",

            padding: 12,

            boxSizing: "border-box",

            overflowY: "auto",

            zIndex: 1000,
          }}
          onClick={() => setShowLimitModal(false)}
        >
          <div
            className="animate-scaleIn"
            style={{
              background: theme.card,

              borderRadius: "24px",

              padding: "clamp(18px, 5vw, 32px)",

              width: "min(380px, calc(100vw - 24px))",

              maxWidth: "100%",
              maxHeight: "calc(100dvh - 24px)",
              overflowY: "auto",
              boxSizing: "border-box",
              minWidth: 0,

              border: `1px solid ${theme.border}`,

              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",

                justifyContent: "space-between",

                alignItems: "center",

                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  margin: 0,

                  fontWeight: "800",

                  fontSize: "20px",

                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Change Monthly Budget Limit
              </h3>

              <button
                onClick={() => setShowLimitModal(false)}
                className="hover-scale"
                style={{
                  background: "none",

                  border: "none",

                  color: theme.secondary,

                  cursor: "pointer",

                  padding: "4px",
                }}
              >
                <X size={20} />
              </button>
            </div>

            <p
              style={{
                color: theme.secondary,

                fontSize: "13px",

                margin: "0 0 20px 0",

                fontFamily: "'Inter', sans-serif",
              }}
            >
              Current limit: ₹{(monthlyLimit || 0).toLocaleString("en-IN")}
            </p>

            <label
              style={{
                fontSize: "13px",

                fontWeight: "700",

                marginBottom: "8px",

                display: "block",

                color: theme.secondary,

                fontFamily: "'Inter', sans-serif",
              }}
            >
              New Monthly Limit (₹)
            </label>

            <input
              type="number"
              placeholder="e.g. 30000"
              value={newLimit}
              onChange={(e) => setNewLimit(e.target.value)}
              className="hover-lift"
              style={{
                width: "100%",

                padding: "12px 16px",

                background: theme.bg,

                border: `1px solid ${theme.border}`,

                borderRadius: "12px",

                color: theme.text,

                fontSize: "14px",

                outline: "none",

                boxSizing: "border-box",

                fontFamily: "'Inter', sans-serif",

                marginTop: "8px",
              }}
            />

            <button
              onClick={handleSaveLimit}
              disabled={savingLimit}
              className="hover-glow"
              style={{
                width: "100%",

                background: theme.primary,

                color: "white",

                border: "none",

                padding: "14px",

                borderRadius: "12px",

                fontWeight: "bold",

                fontSize: "15px",

                cursor: savingLimit ? "not-allowed" : "pointer",

                marginTop: "24px",

                opacity: savingLimit ? 0.7 : 1,

                fontFamily: "'Inter', sans-serif",
              }}
            >
              {savingLimit ? "Saving..." : "Save New Limit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;
