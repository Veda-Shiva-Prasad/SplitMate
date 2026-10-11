import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Trash2,
  Users,
  X,
  AlertCircle,
} from "lucide-react";
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
import { useData } from "../context/DataContext";

const CATEGORIES = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Health",
  "Shopping",
  "Other",
];

const CATEGORY_COLORS = {
  Food: "#F59E0B",
  Transport: "#3B82F6",
  Bills: "#8B5CF6",
  Entertainment: "#EC4899",
  Health: "#10B981",
  Shopping: "#F43F5E",
  Other: "#94A3B8",
};

const CATEGORY_ICONS = {
  Food: "🍔",
  Transport: "🚗",
  Bills: "⚡",
  Entertainment: "🎬",
  Health: "💊",
  Shopping: "🛒",
  Other: "📦",
};

const money = (value) =>
  `₹${Math.round(Number(value) || 0).toLocaleString("en-IN")}`;

const amountOf = (transaction) => Math.abs(Number(transaction?.amount) || 0);

const getTransactionDate = (transaction) => {
  if (!transaction?.rawDate) return null;

  const date = new Date(transaction.rawDate);

  // Ignore invalid dates and dates outside JavaScript's valid range.
  if (Number.isNaN(date.getTime())) return null;

  // Prevent malformed legacy dates from distorting the charts.
  if (date.getFullYear() < 2000 || date.getFullYear() > 2100) return null;

  return date;
};

const Dashboard = ({ isDarkMode, setIsDarkMode }) => {
  const {
    transactions: contextTransactions,
    owedList: contextOwedList,
    budgets: contextBudgets,
    monthlyBudget: contextMonthlyBudget,
    refreshData,
  } = useData();

  const [chartView, setChartView] = useState("weekly");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showOwedModal, setShowOwedModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [owedList, setOwedList] = useState([]);
  const [savedBudgets, setSavedBudgets] = useState([]);
  const [monthlyBudget, setMonthlyBudget] = useState(20000);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [expenseForm, setExpenseForm] = useState({
    description: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().slice(0, 10),
  });

  const [owedForm, setOwedForm] = useState({
    name: "",
    amount: "",
    description: "",
  });

  const [newBudgetValue, setNewBudgetValue] = useState("20000");

  const userName = localStorage.getItem("userName") || "User";

  const fetchDashboardData = useCallback(async () => {
    try {
      const [expensesResult, owedResult, limitResult, budgetsResult] =
        await Promise.allSettled([
          API.get("/expenses"),
          API.get("/owed"),
          API.get("/budgets/limit"),
          API.get("/budgets"),
        ]);

      if (expensesResult.status === "fulfilled") {
        setTransactions(
          Array.isArray(expensesResult.value.data)
            ? expensesResult.value.data
            : [],
        );
      }

      if (owedResult.status === "fulfilled") {
        setOwedList(
          Array.isArray(owedResult.value.data) ? owedResult.value.data : [],
        );
      }

      if (limitResult.status === "fulfilled") {
        const limit = Number(limitResult.value.data?.limit);
        if (Number.isFinite(limit) && limit > 0) {
          setMonthlyBudget(limit);
          setNewBudgetValue(String(limit));
        }
      }

      if (budgetsResult.status === "fulfilled") {
        setSavedBudgets(
          Array.isArray(budgetsResult.value.data)
            ? budgetsResult.value.data
            : [],
        );
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Keep dashboard values synchronized with the shared application data.
  useEffect(() => {
    if (Array.isArray(contextTransactions)) {
      setTransactions(contextTransactions);
    }
  }, [contextTransactions]);

  useEffect(() => {
    if (Array.isArray(contextOwedList)) {
      setOwedList(contextOwedList);
    }
  }, [contextOwedList]);

  useEffect(() => {
    if (Array.isArray(contextBudgets)) {
      setSavedBudgets(contextBudgets);
    }
  }, [contextBudgets]);

  useEffect(() => {
    const limit = Number(contextMonthlyBudget);
    if (Number.isFinite(limit) && limit > 0) {
      setMonthlyBudget(limit);
      setNewBudgetValue(String(limit));
    }
  }, [contextMonthlyBudget]);

  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const monthlyTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const date = getTransactionDate(transaction);
        return (
          date &&
          date.getFullYear() === currentYear &&
          date.getMonth() === currentMonth
        );
      }),
    [transactions, currentYear, currentMonth],
  );

  const totalSpent = useMemo(
    () => transactions.reduce((total, item) => total + amountOf(item), 0),
    [transactions],
  );

  const monthlySpent = useMemo(
    () =>
      monthlyTransactions.reduce((total, item) => total + amountOf(item), 0),
    [monthlyTransactions],
  );

  const budgetPercent =
    monthlyBudget > 0
      ? Math.min(100, Math.round((monthlySpent / monthlyBudget) * 100))
      : 0;

  const pendingOwed = owedList.filter((item) => !item?.settled);

  const totalOwed = pendingOwed.reduce(
    (total, item) => total + (Number(item?.amount) || 0),
    0,
  );

  const weeklyData = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() - today.getDay(),
    );

    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
      (name, index) => {
        const day = new Date(firstDay);
        day.setDate(firstDay.getDate() + index);

        const amount = transactions.reduce((total, transaction) => {
          const date = getTransactionDate(transaction);

          if (
            date &&
            date.getFullYear() === day.getFullYear() &&
            date.getMonth() === day.getMonth() &&
            date.getDate() === day.getDate()
          ) {
            return total + amountOf(transaction);
          }

          return total;
        }, 0);

        return { name, amount };
      },
    );
  }, [transactions]);

  const monthlyChartData = useMemo(
    () =>
      Array.from({ length: 12 }, (_, index) => {
        const amount = transactions.reduce((total, transaction) => {
          const date = getTransactionDate(transaction);

          if (
            date &&
            date.getFullYear() === currentYear &&
            date.getMonth() === index
          ) {
            return total + amountOf(transaction);
          }

          return total;
        }, 0);

        return {
          name: new Date(currentYear, index, 1).toLocaleString("en-IN", {
            month: "short",
          }),
          amount,
        };
      }),
    [transactions, currentYear],
  );

  const categoryProgress = useMemo(() => {
    return CATEGORIES.map((category) => {
      const spent = monthlyTransactions.reduce((total, transaction) => {
        return transaction.category === category
          ? total + amountOf(transaction)
          : total;
      }, 0);

      const budget = savedBudgets.find(
        (item) => item.category === category && item.category !== "Monthly",
      );

      return {
        name: category,
        spent,
        limit: Number(budget?.limit) || 0,
        color: CATEGORY_COLORS[category],
      };
    }).filter((item) => item.spent > 0 || item.limit > 0);
  }, [monthlyTransactions, savedBudgets]);

  const refreshDashboard = async () => {
    await fetchDashboardData();

    if (typeof refreshData === "function") {
      await refreshData();
    }
  };

  const handleAddExpense = async (event) => {
    event.preventDefault();
    setFormError("");

    const amount = Number(expenseForm.amount);

    if (!expenseForm.description.trim()) {
      setFormError("Please enter an expense description.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Please enter a valid amount greater than zero.");
      return;
    }

    if (!expenseForm.date) {
      setFormError("Please select an expense date.");
      return;
    }

    setSaving(true);

    try {
      await API.post("/expenses", {
        description: expenseForm.description.trim(),
        amount,
        category: expenseForm.category,
        date: new Date(`${expenseForm.date}T12:00:00`).toISOString(),
        icon: CATEGORY_ICONS[expenseForm.category] || "📦",
      });

      setShowExpenseModal(false);
      setExpenseForm({
        description: "",
        amount: "",
        category: "Food",
        date: new Date().toISOString().slice(0, 10),
      });

      await refreshDashboard();
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Unable to add the expense.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Delete this expense? This cannot be undone.")) {
      return;
    }

    try {
      await API.delete(`/expenses/${id}`);
      await refreshDashboard();
    } catch (error) {
      window.alert(
        error.response?.data?.message || "Unable to delete the expense.",
      );
    }
  };

  const handleAddOwed = async (event) => {
    event.preventDefault();
    setFormError("");

    const amount = Number(owedForm.amount);

    if (!owedForm.name.trim()) {
      setFormError("Please enter a person's name.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setFormError("Please enter a valid amount greater than zero.");
      return;
    }

    setSaving(true);

    try {
      await API.post("/owed", {
        name: owedForm.name.trim(),
        amount,
        description: owedForm.description.trim() || "Shared expense",
      });

      setShowOwedModal(false);
      setOwedForm({ name: "", amount: "", description: "" });

      await refreshDashboard();
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Unable to add the owed entry.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOwed = async (id) => {
    if (!window.confirm("Delete this owed entry?")) return;

    try {
      await API.delete(`/owed/${id}`);
      await refreshDashboard();
    } catch (error) {
      window.alert(
        error.response?.data?.message || "Unable to delete this entry.",
      );
    }
  };

  const handleSettleOwed = async (id) => {
    try {
      await API.put(`/owed/${id}/settle`);
      await refreshDashboard();
    } catch (error) {
      window.alert(
        error.response?.data?.message || "Unable to settle this entry.",
      );
    }
  };

  const handleUpdateBudget = async (event) => {
    event.preventDefault();

    const value = Number(newBudgetValue);

    if (!Number.isFinite(value) || value <= 0) {
      setFormError("Enter a valid monthly budget greater than zero.");
      return;
    }

    setSaving(true);
    setFormError("");

    try {
      await API.put("/budgets/limit", { limit: value });
      setMonthlyBudget(value);
      setShowBudgetModal(false);
      await refreshDashboard();
    } catch (error) {
      setFormError(
        error.response?.data?.message || "Unable to update the budget.",
      );
    } finally {
      setSaving(false);
    }
  };

  const theme = {
    background: isDarkMode ? "#0A0F1E" : "#F1F5F9",
    card: isDarkMode ? "#111827" : "#FFFFFF",
    border: isDarkMode ? "#1E2D45" : "#E2E8F0",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    secondary: isDarkMode ? "#94A3B8" : "#64748B",
    primary: "#3B82F6",
  };

  const cardStyle = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 20,
    minWidth: 0,
  };

  const buttonStyle = {
    border: 0,
    borderRadius: 9,
    padding: "10px 14px",
    background: theme.primary,
    color: "#FFFFFF",
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: 11,
    marginTop: 6,
    borderRadius: 8,
    border: `1px solid ${theme.border}`,
    background: theme.background,
    color: theme.text,
    fontSize: 14,
  };

  const modalStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(0,0,0,0.55)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  };

  const modalCardStyle = {
    width: 440,
    maxWidth: "100%",
    maxHeight: "90vh",
    overflowY: "auto",
    background: theme.card,
    color: theme.text,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 24,
  };

  const modalTitleStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  };

  const chartData = chartView === "weekly" ? weeklyData : monthlyChartData;

  return (
    <div
      style={{
        background: theme.background,
        color: theme.text,
        minHeight: "100vh",
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main
        style={{
          maxWidth: 1800,
          margin: "0 auto",
          padding: "26px clamp(16px, 3vw, 40px)",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 22,
          }}
        >
          {/* <div>
            <h1 style={{ margin: 0, fontSize: 25 }}>AI Financial Dashboard</h1>
            <p style={{ margin: "7px 0 0", color: theme.secondary }}>
              Welcome back, {userName}   Here's your financial overview
            </p>
          </div> */}

          <div>
            <h1 style={{ margin: 0, fontSize: 25, fontWeight: 700 }}>
              AI Financial Dashboard
            </h1>

            <p style={{ margin: "7px 0 0", color: theme.secondary }}>
              Welcome back,{" "}
              <strong style={{ fontWeight: 700, color: theme.text }}>
                {userName || "there"}
              </strong>
              ! Here's your financial overview.
            </p>
          </div>

          <button
            style={buttonStyle}
            onClick={() => {
              setFormError("");
              setShowExpenseModal(true);
            }}
          >
            <Plus size={17} /> Add New Expense
          </button>
        </header>

        {loading && (
          <p style={{ color: theme.secondary }}>Loading your dashboard...</p>
        )}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <div style={cardStyle}>
            <small style={{ color: theme.secondary }}>ALL-TIME SPENT</small>
            <h2 style={{ margin: "10px 0", color: "#F43F5E" }}>
              {money(totalSpent)}
            </h2>
            <small style={{ color: theme.secondary }}>
              {transactions.length} saved expenses
            </small>
          </div>

          <div style={cardStyle}>
            <small style={{ color: theme.secondary }}>THIS MONTH</small>
            <h2 style={{ margin: "10px 0", color: "#F43F5E" }}>
              {money(monthlySpent)}
            </h2>
            <small style={{ color: theme.secondary }}>
              {monthlyTransactions.length} expenses this month
            </small>
          </div>

          <div style={cardStyle}>
            <small style={{ color: theme.secondary }}>YOU ARE OWED</small>
            <h2 style={{ margin: "10px 0", color: "#10B981" }}>
              {money(totalOwed)}
            </h2>
            <small style={{ color: theme.secondary }}>
              {pendingOwed.length} pending entries
            </small>
          </div>

          <div style={cardStyle}>
            <small style={{ color: theme.secondary }}>MONTHLY BUDGET</small>
            <h2 style={{ margin: "10px 0", color: "#F59E0B" }}>
              {money(monthlyBudget)}
            </h2>
            <small style={{ color: theme.secondary }}>
              {money(monthlySpent)} used ({budgetPercent}%)
            </small>

            <div
              style={{
                height: 5,
                background: theme.border,
                borderRadius: 10,
                overflow: "hidden",
                marginTop: 12,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${budgetPercent}%`,
                  background: budgetPercent >= 100 ? "#F43F5E" : "#F59E0B",
                }}
              />
            </div>

            <button
              style={{
                ...buttonStyle,
                marginTop: 12,
                padding: "7px 10px",
                fontSize: 12,
              }}
              onClick={() => {
                setNewBudgetValue(String(monthlyBudget));
                setFormError("");
                setShowBudgetModal(true);
              }}
            >
              Change Limit
            </button>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(260px, 1fr)",
            gap: 16,
            marginBottom: 22,
          }}
        >
          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 10,
                marginBottom: 18,
              }}
            >
              <h3 style={{ margin: 0 }}>Spending Analysis</h3>

              <div style={{ display: "flex", gap: 8 }}>
                {["weekly", "monthly"].map((view) => (
                  <button
                    key={view}
                    onClick={() => setChartView(view)}
                    style={{
                      ...buttonStyle,
                      padding: "7px 12px",
                      fontSize: 12,
                      background:
                        chartView === view ? theme.primary : theme.background,
                      color: chartView === view ? "#FFFFFF" : theme.text,
                      border:
                        chartView === view
                          ? "none"
                          : `1px solid ${theme.border}`,
                    }}
                  >
                    {view === "weekly" ? "Weekly" : "Monthly"}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ width: "100%", height: 270 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.border} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: theme.secondary, fontSize: 12 }}
                  />
                  <YAxis
                    tick={{ fill: theme.secondary, fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip
                    formatter={(value) => money(value)}
                    contentStyle={{
                      background: theme.card,
                      border: `1px solid ${theme.border}`,
                      borderRadius: 8,
                      color: theme.text,
                    }}
                  />
                  <Bar
                    dataKey="amount"
                    name="Expenses"
                    fill={theme.primary}
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div
            style={{
              ...cardStyle,
              background: isDarkMode
                ? "linear-gradient(145deg, #1E3A5F, #0A0F1E)"
                : "linear-gradient(145deg, #1E3A5F, #0F172A)",
              color: "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 270,
            }}
          >
            <div>
              <h3 style={{ marginTop: 0, color: "#60A5FA" }}>
                <TrendingUp
                  size={17}
                  style={{ verticalAlign: "middle", marginRight: 7 }}
                />
                Spending Insight
              </h3>

              {monthlyTransactions.length === 0 ? (
                <p>
                  No expenses recorded this month yet. Add an expense to track
                  your monthly spending.
                </p>
              ) : (
                <p>
                  You have spent{" "}
                  <strong style={{ color: "#FB7185" }}>
                    {money(monthlySpent)}
                  </strong>{" "}
                  this month across {monthlyTransactions.length} expense
                  {monthlyTransactions.length === 1 ? "" : "s"}.{" "}
                  {monthlySpent < monthlyBudget
                    ? `${money(monthlyBudget - monthlySpent)} of your monthly budget remains.`
                    : "You have reached or exceeded your monthly budget."}
                </p>
              )}
            </div>

            <div
              style={{
                background: "rgba(16,185,129,0.12)",
                color: "#10B981",
                padding: 12,
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <AlertCircle
                size={15}
                style={{ verticalAlign: "middle", marginRight: 6 }}
              />
              Budget usage: {budgetPercent}%
            </div>
          </div>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Recent Transactions</h3>

            {transactions.length === 0 ? (
              <p style={{ color: theme.secondary }}>
                No transactions yet. Add your first expense.
              </p>
            ) : (
              transactions.slice(0, 8).map((transaction) => (
                <div
                  key={transaction.id || transaction._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 0",
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  <span style={{ fontSize: 22 }}>
                    {transaction.icon ||
                      CATEGORY_ICONS[transaction.category] ||
                      "📦"}
                  </span>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        display: "block",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {transaction.name || transaction.description || "Expense"}
                    </strong>
                    <small style={{ color: theme.secondary }}>
                      {transaction.date || "Date unavailable"} ·{" "}
                      {transaction.category || "Other"}
                    </small>
                  </div>

                  <strong style={{ color: "#F43F5E", whiteSpace: "nowrap" }}>
                    {money(amountOf(transaction))}
                  </strong>

                  <button
                    title="Delete expense"
                    onClick={() =>
                      handleDeleteExpense(transaction.id || transaction._id)
                    }
                    style={{
                      border: 0,
                      borderRadius: 6,
                      padding: 7,
                      cursor: "pointer",
                      color: "#F43F5E",
                      background: isDarkMode ? "#3B1724" : "#FFE4E6",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))
            )}
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0 }}>Budget Progress</h3>

            {categoryProgress.length === 0 ? (
              <p style={{ color: theme.secondary }}>
                Add category budgets to see your progress.
              </p>
            ) : (
              categoryProgress.map((item) => (
                <div key={item.name} style={{ marginBottom: 18 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      fontSize: 13,
                      marginBottom: 7,
                    }}
                  >
                    <strong>{item.name}</strong>
                    <span style={{ color: theme.secondary }}>
                      {money(item.spent)} /{" "}
                      {item.limit > 0 ? money(item.limit) : "No limit"}
                    </span>
                  </div>

                  <div
                    style={{
                      height: 6,
                      background: theme.border,
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width:
                          item.limit > 0
                            ? `${Math.min(100, (item.spent / item.limit) * 100)}%`
                            : "0%",
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={cardStyle}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 10,
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                <Users
                  size={17}
                  style={{ verticalAlign: "middle", marginRight: 6 }}
                />
                You Are Owed
              </h3>

              <button
                style={{ ...buttonStyle, padding: "7px 10px", fontSize: 12 }}
                onClick={() => {
                  setFormError("");
                  setShowOwedModal(true);
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {pendingOwed.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: theme.secondary,
                  padding: "35px 5px",
                }}
              >
                <div style={{ fontSize: 32 }}>🤝</div>
                <p style={{ marginBottom: 5 }}>No pending settlements.</p>
                <small>Add people who owe you money.</small>
              </div>
            ) : (
              pendingOwed.map((item) => (
                <div
                  key={item._id || item.id}
                  style={{
                    padding: "12px 0",
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  <strong>{item.name || item.personName || "Contact"}</strong>
                  <p style={{ margin: "6px 0", color: "#10B981" }}>
                    {money(item.amount)}
                  </p>
                  <small style={{ color: theme.secondary }}>
                    {item.description || "Shared expense"}
                  </small>

                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      style={{
                        ...buttonStyle,
                        padding: "6px 9px",
                        fontSize: 12,
                      }}
                      onClick={() => handleSettleOwed(item._id || item.id)}
                    >
                      Mark settled
                    </button>

                    <button
                      style={{
                        ...buttonStyle,
                        padding: "6px 9px",
                        fontSize: 12,
                        background: "#F43F5E",
                      }}
                      onClick={() => handleDeleteOwed(item._id || item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {showExpenseModal && (
        <div style={modalStyle}>
          <form onSubmit={handleAddExpense} style={modalCardStyle}>
            <div style={modalTitleStyle}>
              <h2 style={{ margin: 0 }}>Add Expense</h2>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: theme.text,
                }}
              >
                <X />
              </button>
            </div>

            {formError && <p style={{ color: "#F43F5E" }}>{formError}</p>}

            <label>
              Description
              <input
                style={inputStyle}
                value={expenseForm.description}
                onChange={(event) =>
                  setExpenseForm({
                    ...expenseForm,
                    description: event.target.value,
                  })
                }
                maxLength={120}
                required
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              Amount (₹)
              <input
                style={inputStyle}
                type="number"
                min="0.01"
                step="0.01"
                value={expenseForm.amount}
                onChange={(event) =>
                  setExpenseForm({
                    ...expenseForm,
                    amount: event.target.value,
                  })
                }
                required
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              Category
              <select
                style={inputStyle}
                value={expenseForm.category}
                onChange={(event) =>
                  setExpenseForm({
                    ...expenseForm,
                    category: event.target.value,
                  })
                }
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              Date
              <input
                style={inputStyle}
                type="date"
                value={expenseForm.date}
                onChange={(event) =>
                  setExpenseForm({
                    ...expenseForm,
                    date: event.target.value,
                  })
                }
                required
              />
            </label>

            <button
              style={{ ...buttonStyle, width: "100%", marginTop: 20 }}
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Expense"}
            </button>
          </form>
        </div>
      )}

      {showOwedModal && (
        <div style={modalStyle}>
          <form onSubmit={handleAddOwed} style={modalCardStyle}>
            <div style={modalTitleStyle}>
              <h2 style={{ margin: 0 }}>Add Owed Entry</h2>
              <button
                type="button"
                onClick={() => setShowOwedModal(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: theme.text,
                }}
              >
                <X />
              </button>
            </div>

            {formError && <p style={{ color: "#F43F5E" }}>{formError}</p>}

            <label>
              Person's name
              <input
                style={inputStyle}
                value={owedForm.name}
                onChange={(event) =>
                  setOwedForm({ ...owedForm, name: event.target.value })
                }
                required
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              Amount (₹)
              <input
                style={inputStyle}
                type="number"
                min="0.01"
                step="0.01"
                value={owedForm.amount}
                onChange={(event) =>
                  setOwedForm({ ...owedForm, amount: event.target.value })
                }
                required
              />
            </label>

            <label style={{ display: "block", marginTop: 14 }}>
              Description
              <input
                style={inputStyle}
                value={owedForm.description}
                onChange={(event) =>
                  setOwedForm({
                    ...owedForm,
                    description: event.target.value,
                  })
                }
              />
            </label>

            <button
              style={{ ...buttonStyle, width: "100%", marginTop: 20 }}
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Entry"}
            </button>
          </form>
        </div>
      )}

      {showBudgetModal && (
        <div style={modalStyle}>
          <form onSubmit={handleUpdateBudget} style={modalCardStyle}>
            <div style={modalTitleStyle}>
              <h2 style={{ margin: 0 }}>Update Monthly Budget</h2>
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                style={{
                  border: 0,
                  background: "transparent",
                  color: theme.text,
                }}
              >
                <X />
              </button>
            </div>

            {formError && <p style={{ color: "#F43F5E" }}>{formError}</p>}

            <label>
              Monthly budget (₹)
              <input
                style={inputStyle}
                type="number"
                min="1"
                step="1"
                value={newBudgetValue}
                onChange={(event) => setNewBudgetValue(event.target.value)}
                required
              />
            </label>

            <button
              style={{ ...buttonStyle, width: "100%", marginTop: 20 }}
              type="submit"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Budget"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
