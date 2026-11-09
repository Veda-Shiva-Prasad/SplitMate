import React, { useState, useEffect } from "react";
import { Plus, X, Edit2, Trash2, Calendar, DollarSign } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import API from "../utils/api";

const Recurring = ({ isDarkMode, setIsDarkMode }) => {
  const [recurring, setRecurring] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    category: "Bills",
    frequency: "Monthly",
    nextDue: "",
    icon: "🔄",
  });
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    setLoading(true);
    try {
      const res = await API.get("/recurring");
      setRecurring(res.data);
    } catch (error) {
      console.error("Error fetching recurring payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.amount || !form.nextDue) return;
    try {
      if (editItem) {
        await API.put(`/recurring/${editItem._id}`, form);
      } else {
        await API.post("/recurring", form);
      }
      setShowModal(false);
      setEditItem(null);
      setForm({
        name: "",
        amount: "",
        category: "Bills",
        frequency: "Monthly",
        nextDue: "",
        icon: "🔄",
      });
      fetchRecurring();
    } catch (error) {
      console.error("Error saving recurring payment:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/recurring/${id}`);
      fetchRecurring();
    } catch (error) {
      console.error("Error deleting recurring payment:", error);
    }
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      name: item.name,
      amount: item.amount,
      category: item.category,
      frequency: item.frequency,
      nextDue: item.nextDue,
      icon: item.icon,
    });
    setShowModal(true);
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
          Loading recurring payments...
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
              Recurring Payments
            </h1>
            <p
              style={{
                color: theme.secondary,
                margin: "4px 0 0 0",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Manage your regular bills and subscriptions
            </p>
          </div>
          <button
            onClick={() => {
              setEditItem(null);
              setForm({
                name: "",
                amount: "",
                category: "Bills",
                frequency: "Monthly",
                nextDue: "",
                icon: "🔄",
              });
              setShowModal(true);
            }}
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
            }}
          >
            <Plus size={18} /> Add Recurring
          </button>
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
              label: "Total Monthly",
              value: `₹${recurring
                .filter((r) => r.frequency === "Monthly")
                .reduce((s, r) => s + r.amount, 0)
                .toLocaleString("en-IN")}`,
              color: "#10B981",
            },
            {
              label: "Active Payments",
              value: recurring.length,
              color: "#3B82F6",
            },
            {
              label: "Next Due Amount",
              value: `₹${recurring.reduce((s, r) => s + r.amount, 0).toLocaleString("en-IN")}`,
              color: "#F59E0B",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="hover-lift"
              style={{
                backgroundColor: theme.card,
                padding: "24px",
                borderRadius: "16px",
                border: `1px solid ${theme.border}`,
              }}
            >
              <p
                style={{
                  color: theme.secondary,
                  margin: "0 0 6px 0",
                  fontSize: "12px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {card.label}
              </p>
              <h2
                style={{
                  margin: 0,
                  fontSize: "26px",
                  color: card.color,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {card.value}
              </h2>
            </div>
          ))}
        </div>

        {recurring.length === 0 ? (
          <div
            className="animate-fadeInUp"
            style={{
              backgroundColor: theme.card,
              padding: "60px",
              borderRadius: "20px",
              border: `1px solid ${theme.border}`,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "40px", margin: "0 0 12px 0" }}>🔄</p>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontWeight: "700",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              No recurring payments
            </h3>
            <p
              style={{
                color: theme.secondary,
                margin: "0 0 20px 0",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Add your regular bills and subscriptions to track them
            </p>
            <button
              onClick={() => setShowModal(true)}
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
              + Add First Payment
            </button>
          </div>
        ) : (
          <div
            className="stagger-children"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: "20px",
            }}
          >
            {recurring.map((item) => {
              const dueDate = new Date(item.nextDue);
              const today = new Date();
              const daysUntil = Math.ceil(
                (dueDate - today) / (1000 * 60 * 60 * 24),
              );
              const isUrgent = daysUntil <= 3 && daysUntil >= 0;
              const isOverdue = daysUntil < 0;

              return (
                <div
                  key={item._id}
                  className="hover-lift"
                  style={{
                    backgroundColor: theme.card,
                    padding: "24px",
                    borderRadius: "20px",
                    border: `1px solid ${isUrgent ? "#F59E0B60" : isOverdue ? "#F43F5E60" : theme.border}`,
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div style={{ fontSize: "32px" }}>
                        {item.icon || getFrequencyIcon(item.frequency)}
                      </div>
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "16px",
                            fontWeight: "800",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {item.name}
                        </h3>
                        <p
                          style={{
                            margin: "2px 0 0 0",
                            fontSize: "12px",
                            color: theme.secondary,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {item.category}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => openEdit(item)}
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
                        onClick={() => handleDelete(item._id)}
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
                  <div style={{ marginBottom: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: "800",
                          color: theme.primary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        ₹{item.amount.toLocaleString("en-IN")}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: theme.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {item.frequency}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: "12px",
                      borderTop: `1px solid ${theme.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <Calendar size={14} color={theme.secondary} />
                      <span
                        style={{
                          fontSize: "13px",
                          color: isUrgent
                            ? "#F59E0B"
                            : isOverdue
                              ? "#F43F5E"
                              : theme.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {isOverdue ? "Overdue" : `Due in ${daysUntil} days`}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <DollarSign size={14} color={theme.secondary} />
                      <span
                        style={{
                          fontSize: "13px",
                          color: theme.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {new Date(item.nextDue).toLocaleDateString("en-IN")}
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
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="animate-scaleIn"
            style={{
              background: theme.card,
              borderRadius: "24px",
              padding: "32px",
              width: "460px",
              maxWidth: "90%",
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
                {editItem ? "Edit Recurring Payment" : "Add Recurring Payment"}
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
                Payment Name
              </label>
              <input
                type="text"
                placeholder="e.g. Netflix Subscription"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="hover-lift"
                style={inputStyle}
              />
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
                Amount (₹)
              </label>
              <input
                type="number"
                placeholder="e.g. 649"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="hover-lift"
                style={inputStyle}
              />
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
                  "Bills",
                  "Subscriptions",
                  "Rent",
                  "Insurance",
                  "Loans",
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
                Frequency
              </label>
              <select
                value={form.frequency}
                onChange={(e) =>
                  setForm({ ...form, frequency: e.target.value })
                }
                className="hover-lift"
                style={inputStyle}
              >
                {["Weekly", "Monthly", "Quarterly", "Yearly"].map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "24px" }}>
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
                Next Due Date
              </label>
              <input
                type="date"
                value={form.nextDue}
                onChange={(e) => setForm({ ...form, nextDue: e.target.value })}
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
              {editItem ? "Save Changes" : "Add Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recurring;
