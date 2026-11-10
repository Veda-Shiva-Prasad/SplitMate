
import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import Navbar from "../components/Navbar.jsx";
import API from "../utils/api";
import "./Recurring.css";

const initialForm = {
  name: "",
  amount: "",
  category: "Bills",
  frequency: "Monthly",
  nextDue: "",
  icon: "🔄",
};

// Convert MongoDB date into HTML date-input format.
const formatDateForInput = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const Recurring = ({ isDarkMode, setIsDarkMode }) => {
  const [recurring, setRecurring] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const theme = {
    bg: isDarkMode ? "#0A0F1E" : "#F1F5F9",
    card: isDarkMode ? "#111827" : "#FFFFFF",
    border: isDarkMode ? "#1E2D45" : "#E2E8F0",
    text: isDarkMode ? "#F1F5F9" : "#1E293B",
    secondary: isDarkMode ? "#94A3B8" : "#64748B",
    primary: "#3B82F6",
  };

  const fetchRecurring = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/recurring");

      setRecurring(
        Array.isArray(response.data) ? response.data : []
      );
    } catch (err) {
      console.error("Error fetching recurring payments:", err);

      setError(
        err.response?.data?.message ||
        "Unable to load recurring payments. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const resetForm = () => {
    setForm(initialForm);
    setEditItem(null);
  };

  const openAddModal = () => {
    resetForm();
    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);

    setForm({
      name: item.name || "",
      amount: String(item.amount ?? ""),
      category: item.category || "Bills",
      frequency: item.frequency || "Monthly",
      nextDue: formatDateForInput(item.nextDue),
      icon: item.icon || "🔄",
    });

    setError("");
    setSuccess("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (saving) return;

    const amount = Number(form.amount);

    if (!form.name.trim()) {
      setError("Please enter a payment name.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    if (!form.nextDue) {
      setError("Please select the next due date.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      amount,
      category: form.category,
      frequency: form.frequency,
      nextDue: form.nextDue,
      icon: form.icon,
    };

    setSaving(true);
    setError("");

    try {
      if (editItem) {
        await API.put(
          `/recurring/${editItem._id}`,
          payload
        );

        setSuccess("Recurring payment updated successfully.");
      } else {
        await API.post("/recurring", payload);

        setSuccess("Recurring payment added successfully.");
      }

      setShowModal(false);
      resetForm();

      await fetchRecurring();
    } catch (err) {
      console.error("Error saving recurring payment:", err);

      setError(
        err.response?.data?.message ||
        "Unable to save payment. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this recurring payment?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await API.delete(`/recurring/${id}`);

      setRecurring((previous) =>
        previous.filter((item) => item._id !== id)
      );

      setSuccess("Recurring payment deleted successfully.");
    } catch (err) {
      console.error("Error deleting recurring payment:", err);

      setError(
        err.response?.data?.message ||
        "Unable to delete this payment."
      );
    }
  };

  const getFrequencyIcon = (frequency) => {
    switch (frequency) {
      case "Weekly":
        return "📅";
      case "Monthly":
        return "📆";
      case "Quarterly":
        return "📊";
      case "Yearly":
        return "🎉";
      default:
        return "🔄";
    }
  };

  const getDaysUntil = (date) => {
    const due = new Date(date);
    const today = new Date();

    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return Math.ceil(
      (due.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24)
    );
  };

  const monthlyTotal = recurring
    .filter((item) => item.frequency === "Monthly")
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const nextDueAmount = recurring
    .filter((item) => getDaysUntil(item.nextDue) >= 0)
    .sort(
      (a, b) =>
        new Date(a.nextDue) - new Date(b.nextDue)
    )
    .slice(0, 1)
    .reduce((total, item) => total + Number(item.amount || 0), 0);

  const formatCurrency = (amount) =>
    `₹${Number(amount).toLocaleString("en-IN")}`;

  if (loading) {
    return (
      <div
        className="recurring-loading"
        style={{
          background: theme.bg,
          color: theme.text,
        }}
      >
        <RefreshCw className="recurring-spinner" size={28} />
        <p>Loading recurring payments...</p>
      </div>
    );
  }

  return (
    <div
      className="recurring-page"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
      }}
    >
      <Navbar
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <main className="recurring-main">
        <div className="recurring-header">
          <div>
            <h1>Recurring Payments</h1>
            <p>
              Manage your regular bills and subscriptions
            </p>
          </div>

          <button
            className="recurring-add-btn"
            onClick={openAddModal}
          >
            <Plus size={18} />
            Add Recurring
          </button>
        </div>

        {error && !showModal && (
          <div className="recurring-alert recurring-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="recurring-alert recurring-success">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        <div className="recurring-stats">
          <div
            className="recurring-stat-card"
            style={{
              background: theme.card,
              borderColor: theme.border,
            }}
          >
            <span>Total Monthly</span>
            <h2 style={{ color: "#10B981" }}>
              {formatCurrency(monthlyTotal)}
            </h2>
          </div>

          <div
            className="recurring-stat-card"
            style={{
              background: theme.card,
              borderColor: theme.border,
            }}
          >
            <span>Active Payments</span>
            <h2 style={{ color: "#3B82F6" }}>
              {recurring.length}
            </h2>
          </div>

          <div
            className="recurring-stat-card"
            style={{
              background: theme.card,
              borderColor: theme.border,
            }}
          >
            <span>Next Due Amount</span>
            <h2 style={{ color: "#F59E0B" }}>
              {formatCurrency(nextDueAmount)}
            </h2>
          </div>
        </div>

        {recurring.length === 0 ? (
          <div
            className="recurring-empty"
            style={{
              background: theme.card,
              borderColor: theme.border,
            }}
          >
            <div className="recurring-empty-icon">🔄</div>

            <h3>No recurring payments</h3>

            <p>
              Add your regular bills and subscriptions to
              track them.
            </p>

            <button
              className="recurring-add-btn"
              onClick={openAddModal}
            >
              <Plus size={18} />
              Add First Payment
            </button>
          </div>
        ) : (
          <div className="recurring-grid">
            {recurring.map((item) => {
              const daysUntil = getDaysUntil(item.nextDue);

              const isUrgent =
                daysUntil <= 3 && daysUntil >= 0;

              const isOverdue = daysUntil < 0;

              const dueColor = isOverdue
                ? "#F43F5E"
                : isUrgent
                  ? "#F59E0B"
                  : theme.secondary;

              return (
                <div
                  key={item._id}
                  className="recurring-payment-card"
                  style={{
                    background: theme.card,
                    borderColor: isUrgent
                      ? "#F59E0B60"
                      : isOverdue
                        ? "#F43F5E60"
                        : theme.border,
                  }}
                >
                  <div className="recurring-card-top">
                    <div className="recurring-card-title">
                      <span className="recurring-card-icon">
                        {item.icon ||
                          getFrequencyIcon(item.frequency)}
                      </span>

                      <div>
                        <h3>{item.name}</h3>
                        <p>{item.category}</p>
                      </div>
                    </div>

                    <div className="recurring-actions">
                      <button
                        type="button"
                        aria-label="Edit payment"
                        onClick={() => openEdit(item)}
                        className="recurring-icon-btn edit-btn"
                      >
                        <Edit2 size={15} />
                      </button>

                      <button
                        type="button"
                        aria-label="Delete payment"
                        onClick={() => handleDelete(item._id)}
                        className="recurring-icon-btn delete-btn"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="recurring-amount-row">
                    <strong>
                      {formatCurrency(item.amount)}
                    </strong>

                    <span>{item.frequency}</span>
                  </div>

                  <div
                    className="recurring-card-footer"
                    style={{
                      borderColor: theme.border,
                    }}
                  >
                    <div style={{ color: dueColor }}>
                      <Calendar size={15} />

                      <span>
                        {isOverdue
                          ? `Overdue by ${Math.abs(daysUntil)} days`
                          : daysUntil === 0
                            ? "Due today"
                            : `Due in ${daysUntil} days`}
                      </span>
                    </div>

                    <div style={{ color: theme.secondary }}>
                      <DollarSign size={15} />

                      <span>
                        {new Date(item.nextDue).toLocaleDateString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {showModal && (
        <div
          className="recurring-modal-overlay"
          onClick={() => {
            if (!saving) {
              setShowModal(false);
              resetForm();
              setError("");
            }
          }}
        >
          <div
            className={`recurring-modal ${isDarkMode ? "recurring-dark" : "recurring-light"
              }`}
            style={{
              background: theme.card,
              color: theme.text,
              borderColor: theme.border,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="recurring-modal-header">
              <h3>
                {editItem
                  ? "Edit Recurring Payment"
                  : "Add Recurring Payment"}
              </h3>

              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                  setError("");
                }}
              >
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="recurring-alert recurring-error">
                <AlertCircle size={17} />
                {error}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="recurring-form-group">
                <label>Payment Name</label>

                <input
                  type="text"
                  maxLength={100}
                  placeholder="e.g. Netflix Subscription"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="recurring-form-group">
                <label>Amount (₹)</label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="e.g. 649"
                  value={form.amount}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      amount: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="recurring-form-group">
                <label>Category</label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                    })
                  }
                >
                  {[
                    "Bills",
                    "Subscriptions",
                    "Rent",
                    "Insurance",
                    "Loans",
                    "Other",
                  ].map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="recurring-form-group">
                <label>Frequency</label>

                <select
                  value={form.frequency}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      frequency: e.target.value,
                    })
                  }
                >
                  {[
                    "Weekly",
                    "Monthly",
                    "Quarterly",
                    "Yearly",
                  ].map((frequency) => (
                    <option key={frequency} value={frequency}>
                      {frequency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="recurring-form-group">
                <label>Next Due Date</label>

                <input
                  type="date"
                  value={form.nextDue}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nextDue: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="recurring-submit-btn"
              >
                {saving
                  ? "Saving..."
                  : editItem
                    ? "Save Changes"
                    : "Add Payment"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recurring;
