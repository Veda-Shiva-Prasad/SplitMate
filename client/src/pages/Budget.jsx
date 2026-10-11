import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Edit2, Trash2, X, RefreshCw } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Navbar from "../components/Navbar.jsx";
import API from "../utils/api";

const CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
];

const COLORS = {
  Food: "#F59E0B",
  Transport: "#3B82F6",
  Bills: "#8B5CF6",
  Entertainment: "#EC4899",
  Health: "#10B981",
  Shopping: "#F43F5E",
  Other: "#94A3B8",
};

const money = (value) =>
  `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;

const getExpenseDate = (expense) => {
  const value = expense.rawDate || expense.date;
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getExpenseAmount = (expense) => Math.abs(Number(expense.amount) || 0);

export default function Budget({ isDarkMode, setIsDarkMode }) {
  const [budgets, setBudgets] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [monthlyLimit, setMonthlyLimit] = useState(20000);
  const [limitInput, setLimitInput] = useState("20000");
  const [form, setForm] = useState({ category: "Food", limit: "" });
  const [editing, setEditing] = useState(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showLimitForm, setShowLimitForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dark = Boolean(isDarkMode);

  const theme = {
    bg: dark ? "#0A0F1E" : "#F1F5F9",
    card: dark ? "#111827" : "#FFFFFF",
    border: dark ? "#263449" : "#E2E8F0",
    text: dark ? "#F1F5F9" : "#1E293B",
    secondary: dark ? "#94A3B8" : "#64748B",
    primary: "#3B82F6",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    marginTop: 7,
    border: `1px solid ${theme.border}`,
    borderRadius: 9,
    background: theme.bg,
    color: theme.text,
    fontSize: 14,
  };

  const cardStyle = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 22,
  };

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    border: 0,
    borderRadius: 9,
    padding: "10px 14px",
    background: theme.primary,
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [budgetsRes, limitRes, expensesRes] = await Promise.all([
        API.get("/budgets"),
        API.get("/budgets/limit"),
        API.get("/expenses"),
      ]);

      setBudgets(Array.isArray(budgetsRes.data) ? budgetsRes.data : []);

      setExpenses(Array.isArray(expensesRes.data) ? expensesRes.data : []);

      const limit = Number(limitRes.data?.limit) || 20000;
      setMonthlyLimit(limit);
      setLimitInput(String(limit));
    } catch (err) {
      console.error("Budget loading error:", err);
      setError(
        err.response?.data?.message ||
          "Could not load budgets. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const currentMonthExpenses = useMemo(() => {
    const now = new Date();

    return expenses.filter((expense) => {
      const date = getExpenseDate(expense);

      return (
        date &&
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth()
      );
    });
  }, [expenses]);

  const spendingByCategory = useMemo(() => {
    const result = {};

    currentMonthExpenses.forEach((expense) => {
      const category = CATEGORIES.includes(expense.category)
        ? expense.category
        : "Other";

      result[category] = (result[category] || 0) + getExpenseAmount(expense);
    });

    return result;
  }, [currentMonthExpenses]);

  const totalSpent = useMemo(
    () =>
      currentMonthExpenses.reduce(
        (sum, expense) => sum + getExpenseAmount(expense),
        0,
      ),
    [currentMonthExpenses],
  );

  const chartData = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        category,
        spent: spendingByCategory[category] || 0,
        limit:
          Number(
            budgets.find((budget) => budget.category === category)?.limit,
          ) || 0,
      })),
    [spendingByCategory, budgets],
  );

  const monthlyPercentage =
    monthlyLimit > 0 ? Math.round((totalSpent / monthlyLimit) * 100) : 0;

  const openAddForm = () => {
    setEditing(null);
    setForm({ category: "Food", limit: "" });
    setError("");
    setShowBudgetForm(true);
  };

  const openEditForm = (budget) => {
    setEditing(budget);
    setForm({
      category: budget.category,
      limit: String(budget.limit),
    });
    setError("");
    setShowBudgetForm(true);
  };

  const saveBudget = async (event) => {
    event.preventDefault();

    const limit = Number(form.limit);

    if (!Number.isFinite(limit) || limit <= 0) {
      setError("Enter a valid budget limit greater than zero.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await API.post("/budgets", {
        category: form.category,
        limit,
      });

      setShowBudgetForm(false);
      setEditing(null);
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not save the category budget.",
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteBudget = async (id) => {
    if (!window.confirm("Delete this category budget?")) return;

    setError("");

    try {
      await API.delete(`/budgets/${id}`);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete this budget.");
    }
  };

  const saveMonthlyLimit = async (event) => {
    event.preventDefault();

    const limit = Number(limitInput);

    if (!Number.isFinite(limit) || limit <= 0) {
      setError("Enter a valid monthly limit greater than zero.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await API.put("/budgets/limit", { limit });
      setShowLimitForm(false);
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update the monthly limit.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: theme.bg,
          color: theme.text,
        }}
      >
        <div>Loading budgets...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        fontFamily: "Inter, sans-serif",
      }}
    >
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main
        style={{
          maxWidth: 1800,
          margin: "0 auto",
          padding: "28px clamp(16px, 3vw, 40px)",
        }}
      >
        <header
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
            <h1 style={{ margin: 0, fontSize: 28 }}>Budget Planner</h1>
            <p style={{ color: theme.secondary, margin: "7px 0 0" }}>
              Manage and track your monthly spending limits
            </p>
          </div>

          <button style={buttonStyle} onClick={openAddForm}>
            <Plus size={17} /> Add Budget
          </button>
        </header>

        {error && (
          <div
            role="alert"
            style={{
              ...cardStyle,
              marginBottom: 20,
              color: "#F43F5E",
            }}
          >
            {error}
            <button
              onClick={fetchData}
              style={{ ...buttonStyle, marginLeft: 12 }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        <section style={{ ...cardStyle, marginBottom: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 18,
            }}
          >
            <div>
              <div
                style={{
                  color: theme.secondary,
                  fontSize: 12,
                  fontWeight: 800,
                  marginBottom: 7,
                }}
              >
                OVERALL MONTHLY BUDGET
              </div>

              <div style={{ fontSize: 26, fontWeight: 800 }}>
                {money(totalSpent)}{" "}
                <span style={{ fontSize: 16, color: theme.secondary }}>
                  / {money(monthlyLimit)}
                </span>
              </div>
            </div>

            <button
              style={{
                ...buttonStyle,
                color: theme.primary,
                background: `${theme.primary}18`,
                border: `1px solid ${theme.primary}55`,
              }}
              onClick={() => {
                setLimitInput(String(monthlyLimit));
                setError("");
                setShowLimitForm(true);
              }}
            >
              Change Limit
            </button>
          </div>

          <div
            style={{
              height: 9,
              background: theme.border,
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(monthlyPercentage, 100)}%`,
                height: "100%",
                background:
                  monthlyPercentage >= 100 ? "#F43F5E" : theme.primary,
                transition: "width 0.25s ease",
              }}
            />
          </div>

          <p style={{ fontSize: 12, color: theme.secondary, marginBottom: 0 }}>
            {monthlyPercentage}% used —{" "}
            {totalSpent > monthlyLimit
              ? `${money(totalSpent - monthlyLimit)} over budget`
              : `${money(monthlyLimit - totalSpent)} remaining`}
          </p>
        </section>

        {budgets.length === 0 ? (
          <section
            style={{
              ...cardStyle,
              textAlign: "center",
              marginBottom: 24,
              padding: 38,
            }}
          >
            <h3>No category budgets found</h3>
            <p style={{ color: theme.secondary }}>
              Add a category budget to start tracking your spending.
            </p>
            <button style={buttonStyle} onClick={openAddForm}>
              <Plus size={16} /> Create Budget
            </button>
          </section>
        ) : (
          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
              gap: 18,
              marginBottom: 24,
            }}
          >
            {budgets.map((budget) => {
              const spent = spendingByCategory[budget.category] || 0;
              const limit = Number(budget.limit) || 0;
              const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
              const exceeded = spent > limit;

              return (
                <article
                  key={budget._id}
                  style={{
                    ...cardStyle,
                    borderColor: exceeded ? "#F43F5E80" : theme.border,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      <span
                        style={{
                          display: "inline-block",
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: COLORS[budget.category] || "#94A3B8",
                          marginRight: 9,
                        }}
                      />
                      {budget.category}
                    </h3>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        aria-label={`Edit ${budget.category} budget`}
                        onClick={() => openEditForm(budget)}
                        style={{
                          border: 0,
                          borderRadius: 7,
                          padding: 8,
                          background: `${theme.primary}18`,
                          color: theme.primary,
                          cursor: "pointer",
                        }}
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        aria-label={`Delete ${budget.category} budget`}
                        onClick={() => deleteBudget(budget._id)}
                        style={{
                          border: 0,
                          borderRadius: 7,
                          padding: 8,
                          background: "#F43F5E18",
                          color: "#F43F5E",
                          cursor: "pointer",
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <p style={{ color: theme.secondary, fontSize: 13 }}>
                    {money(spent)} of {money(limit)} spent
                  </p>

                  <div
                    style={{
                      height: 8,
                      background: theme.border,
                      borderRadius: 8,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${Math.min(pct, 100)}%`,
                        background: exceeded
                          ? "#F43F5E"
                          : COLORS[budget.category] || theme.primary,
                      }}
                    />
                  </div>

                  <p
                    style={{
                      fontSize: 12,
                      color: exceeded ? "#F43F5E" : theme.secondary,
                      marginBottom: 0,
                    }}
                  >
                    {pct}% used —{" "}
                    {exceeded
                      ? `${money(spent - limit)} over budget`
                      : `${money(limit - spent)} remaining`}
                  </p>
                </article>
              );
            })}
          </section>
        )}

        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Budget Overview by Category</h3>

          {totalSpent === 0 ? (
            <p style={{ color: theme.secondary, padding: "25px 0" }}>
              No expenses recorded this month. Your chart will update when you
              add an expense dated in the current month.
            </p>
          ) : (
            <div style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme.border}
                    vertical={false}
                  />
                  <XAxis dataKey="category" stroke={theme.secondary} />
                  <YAxis
                    stroke={theme.secondary}
                    tickFormatter={(value) => money(value)}
                  />
                  <Tooltip
                    formatter={(value) => money(value)}
                    contentStyle={{
                      background: theme.card,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 10,
                      color: theme.text,
                    }}
                  />
                  <Bar
                    dataKey="spent"
                    name="Spent this month"
                    radius={[4, 4, 0, 0]}
                    fill={theme.primary}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>
      </main>

      {showBudgetForm && (
        <div
          onClick={() => setShowBudgetForm(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "#0009",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <form
            onSubmit={saveBudget}
            onClick={(event) => event.stopPropagation()}
            style={{
              ...cardStyle,
              width: 420,
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2>{editing ? "Edit Budget" : "Add Budget"}</h2>
              <button
                type="button"
                onClick={() => setShowBudgetForm(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: theme.text,
                  cursor: "pointer",
                }}
              >
                <X />
              </button>
            </div>

            <label>
              Category
              <select
                style={inputStyle}
                value={form.category}
                disabled={Boolean(editing)}
                onChange={(event) =>
                  setForm({ ...form, category: event.target.value })
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "block", marginTop: 16 }}>
              Budget limit (₹)
              <input
                style={inputStyle}
                type="number"
                min="1"
                step="0.01"
                required
                value={form.limit}
                onChange={(event) =>
                  setForm({ ...form, limit: event.target.value })
                }
                placeholder="Enter budget limit"
              />
            </label>

            {error && (
              <p role="alert" style={{ color: "#F43F5E", fontSize: 13 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ ...buttonStyle, width: "100%", marginTop: 20 }}
            >
              {saving ? "Saving..." : editing ? "Save Changes" : "Add Budget"}
            </button>
          </form>
        </div>
      )}

      {showLimitForm && (
        <div
          onClick={() => setShowLimitForm(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "#0009",
            display: "grid",
            placeItems: "center",
            padding: 16,
          }}
        >
          <form
            onSubmit={saveMonthlyLimit}
            onClick={(event) => event.stopPropagation()}
            style={{
              ...cardStyle,
              width: 420,
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2>Change Monthly Limit</h2>
              <button
                type="button"
                onClick={() => setShowLimitForm(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: theme.text,
                  cursor: "pointer",
                }}
              >
                <X />
              </button>
            </div>

            <label>
              Monthly budget (₹)
              <input
                style={inputStyle}
                type="number"
                min="1"
                step="0.01"
                required
                value={limitInput}
                onChange={(event) => setLimitInput(event.target.value)}
              />
            </label>

            {error && (
              <p role="alert" style={{ color: "#F43F5E", fontSize: 13 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              style={{ ...buttonStyle, width: "100%", marginTop: 20 }}
            >
              {saving ? "Saving..." : "Save Monthly Limit"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
