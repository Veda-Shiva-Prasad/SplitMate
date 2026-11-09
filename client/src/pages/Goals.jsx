import React, { useState, useEffect } from "react";
import { Plus, X, Archive } from "lucide-react";
import Navbar from "../components/Navbar.jsx";
import API from "../utils/api";

const priorityColors = { High: "#F43F5E", Medium: "#F59E0B", Low: "#10B981" };
const iconOptions = [
  "🎯",
  "💻",
  "✈️",
  "🏦",
  "📱",
  "🏍️",
  "🏠",
  "🎓",
  "💪",
  "🎮",
  "🚗",
  "💍",
  "🌍",
  "🎸",
];

const Goals = ({ isDarkMode, setIsDarkMode }) => {
  const [localGoals, setLocalGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(null);
  const [addAmount, setAddAmount] = useState("");
  const [form, setForm] = useState({
    name: "",
    target: "",
    saved: "0",
    deadline: "",
    priority: "Medium",
    icon: "🎯",
  });
  const [showArchived, setShowArchived] = useState(false);
  const [celebrate, setCelebrate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pageLoaded, setPageLoaded] = useState(false);
  const userName = localStorage.getItem("userName") || "User";

  useEffect(() => {
    setPageLoaded(true);
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await API.get("/goals");
      setLocalGoals(res.data);
    } catch (error) {
      console.error("Error fetching goals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.target || !form.deadline) return;
    try {
      await API.post("/goals", {
        name: form.name,
        target: +form.target,
        saved: +form.saved,
        deadline: form.deadline,
        priority: form.priority,
        icon: form.icon,
      });
      setShowModal(false);
      setForm({
        name: "",
        target: "",
        saved: "0",
        deadline: "",
        priority: "Medium",
        icon: "🎯",
      });
      fetchGoals();
    } catch (error) {
      console.error("Error creating goal:", error);
    }
  };

  const handleAddMoney = async (id) => {
    if (!addAmount) return;
    try {
      const res = await API.post(`/goals/${id}/add`, { amount: +addAmount });
      if (res.data.saved >= res.data.target) setCelebrate(id);
      setAddAmount("");
      setShowAddMoney(null);
      fetchGoals();
      setTimeout(() => setCelebrate(null), 3000);
    } catch (error) {
      console.error("Error adding money:", error);
    }
  };

  const archiveGoal = async (id) => {
    try {
      await API.put(`/goals/${id}`, { archived: true });
      fetchGoals();
    } catch (error) {
      console.error("Error archiving goal:", error);
    }
  };

  const deleteGoal = async (id) => {
    try {
      await API.delete(`/goals/${id}`);
      fetchGoals();
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  const getDaysLeft = (deadline) =>
    Math.max(
      0,
      Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)),
    );
  const getEstimatedDate = (goal) => {
    if (goal.saved >= goal.target) return "Completed!";
    const remaining = goal.target - goal.saved;
    const months = Math.ceil(remaining / 5000);
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return date.toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  };

  const active = localGoals.filter((g) => !g.archived);
  const archived = localGoals.filter((g) => g.archived);

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
          Loading goals...
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
              Savings Goals
            </h1>
            <p
              style={{
                color: theme.secondary,
                margin: "4px 0 0 0",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Track your financial goals and dreams
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
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
            <Plus size={18} /> Add Goal
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
              label: "Total Saved",
              value: `₹${active.reduce((s, g) => s + g.saved, 0).toLocaleString("en-IN")}`,
              color: "#10B981",
            },
            {
              label: "Total Target",
              value: `₹${active.reduce((s, g) => s + g.target, 0).toLocaleString("en-IN")}`,
              color: "#3B82F6",
            },
            {
              label: "Goals Completed",
              value: `${active.filter((g) => g.saved >= g.target).length} / ${active.length}`,
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

        {celebrate && (
          <div
            className="animate-bounceIn"
            style={{
              background: "linear-gradient(135deg, #10B981, #059669)",
              padding: "20px 28px",
              borderRadius: "16px",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >
            <span style={{ fontSize: "36px" }}>🎉</span>
            <div>
              <h3
                style={{
                  margin: 0,
                  color: "white",
                  fontWeight: "800",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Goal Achieved! Congratulations {userName.split(" ")[0]}!
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#D1FAE5",
                  fontSize: "14px",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                You've successfully reached your savings goal!
              </p>
            </div>
          </div>
        )}

        {active.length === 0 ? (
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
            <p style={{ fontSize: "40px", margin: "0 0 12px 0" }}>🎯</p>
            <h3
              style={{
                margin: "0 0 8px 0",
                fontWeight: "700",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              No goals yet
            </h3>
            <p
              style={{
                color: theme.secondary,
                margin: "0 0 20px 0",
                fontSize: "14px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Create your first savings goal and start working towards it
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
              + Add First Goal
            </button>
          </div>
        ) : (
          <div
            className="stagger-children"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "24px",
              marginBottom: "28px",
            }}
          >
            {active.map((goal) => {
              const pct = Math.min(
                Math.round((goal.saved / goal.target) * 100),
                100,
              );
              const completed = pct === 100;
              const daysLeft = getDaysLeft(goal.deadline);
              return (
                <div
                  key={goal._id}
                  className="hover-lift"
                  style={{
                    backgroundColor: theme.card,
                    padding: "28px",
                    borderRadius: "20px",
                    border: `1px solid ${completed ? "#10B98160" : theme.border}`,
                    boxShadow: completed ? "0 0 30px #10B98120" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "28px",
                          width: "50px",
                          height: "50px",
                          borderRadius: "14px",
                          background: `${theme.primary}15`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {goal.icon}
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
                          {goal.name}
                        </h3>
                        <span
                          style={{
                            background: `${priorityColors[goal.priority]}20`,
                            color: priorityColors[goal.priority],
                            fontSize: "11px",
                            padding: "2px 8px",
                            borderRadius: "20px",
                            fontWeight: "700",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {goal.priority} Priority
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        onClick={() => archiveGoal(goal._id)}
                        title="Archive"
                        className="hover-scale"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: theme.secondary,
                          cursor: "pointer",
                        }}
                      >
                        <Archive size={16} />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal._id)}
                        title="Delete"
                        className="hover-scale"
                        style={{
                          background: "#F43F5E20",
                          border: "none",
                          color: "#F43F5E",
                          width: "28px",
                          height: "28px",
                          borderRadius: "6px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "13px",
                        }}
                      >
                        ✕
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
                          fontSize: "22px",
                          fontWeight: "800",
                          color: completed ? "#10B981" : theme.text,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        ₹{goal.saved.toLocaleString("en-IN")}
                      </span>
                      <span
                        style={{
                          fontSize: "14px",
                          color: theme.secondary,
                          fontWeight: "600",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        of ₹{goal.target.toLocaleString("en-IN")}
                      </span>
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
                          width: `${pct}%`,
                          height: "100%",
                          background: completed ? "#10B981" : theme.primary,
                          borderRadius: "10px",
                          transition: "width 0.8s ease",
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "6px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: completed ? "#10B981" : theme.secondary,
                          fontWeight: "600",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {pct}% {completed ? "✓ Complete!" : "saved"}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: daysLeft < 30 ? "#F43F5E" : theme.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {completed ? "" : `${daysLeft} days left`}
                      </span>
                    </div>
                  </div>
                  <p
                    style={{
                      margin: "0 0 16px 0",
                      fontSize: "12px",
                      color: theme.secondary,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Est. completion:{" "}
                    <strong style={{ color: theme.text }}>
                      {getEstimatedDate(goal)}
                    </strong>
                  </p>
                  {!completed &&
                    (showAddMoney === goal._id ? (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <input
                          type="number"
                          placeholder="Amount (₹)"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          className="hover-lift"
                          style={{
                            flex: 1,
                            padding: "10px 12px",
                            background: theme.bg,
                            border: `1px solid ${theme.border}`,
                            borderRadius: "10px",
                            color: theme.text,
                            outline: "none",
                            fontSize: "14px",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        />
                        <button
                          onClick={() => handleAddMoney(goal._id)}
                          className="hover-scale"
                          style={{
                            background: "#10B981",
                            color: "white",
                            border: "none",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontWeight: "700",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Add
                        </button>
                        <button
                          onClick={() => setShowAddMoney(null)}
                          className="hover-scale"
                          style={{
                            background: theme.border,
                            color: theme.secondary,
                            border: "none",
                            padding: "10px 14px",
                            borderRadius: "10px",
                            cursor: "pointer",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddMoney(goal._id)}
                        className="hover-glow"
                        style={{
                          width: "100%",
                          background: `${theme.primary}15`,
                          color: theme.primary,
                          border: `1px solid ${theme.primary}40`,
                          padding: "10px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontWeight: "700",
                          fontSize: "13px",
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        + Add Money
                      </button>
                    ))}
                </div>
              );
            })}
          </div>
        )}

        {archived.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="hover-scale"
              style={{
                background: "transparent",
                border: `1px solid ${theme.border}`,
                color: theme.secondary,
                padding: "10px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "700",
                marginBottom: "16px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {showArchived ? "Hide" : "Show"} Archived Goals ({archived.length}
              )
            </button>
            {showArchived && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "16px",
                }}
              >
                {archived.map((goal) => (
                  <div
                    key={goal._id}
                    style={{
                      backgroundColor: theme.card,
                      padding: "20px",
                      borderRadius: "16px",
                      border: `1px solid ${theme.border}`,
                      opacity: 0.6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span style={{ fontSize: "22px" }}>{goal.icon}</span>
                      <div>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: "700",
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {goal.name}
                        </h3>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "12px",
                            color: theme.secondary,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          ₹{goal.saved.toLocaleString("en-IN")} / ₹
                          {goal.target.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
              maxHeight: "90vh",
              overflowY: "auto",
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
                Add New Goal
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
            {[
              {
                label: "Goal Name",
                key: "name",
                type: "text",
                placeholder: "e.g. Buy Laptop",
              },
              {
                label: "Target Amount (₹)",
                key: "target",
                type: "number",
                placeholder: "e.g. 60000",
              },
              {
                label: "Already Saved (₹)",
                key: "saved",
                type: "number",
                placeholder: "e.g. 10000",
              },
              {
                label: "Target Date",
                key: "deadline",
                type: "date",
                placeholder: "",
              },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: "20px" }}>
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
                  {f.label}
                </label>
                <input
                  type={f.type}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) =>
                    setForm({ ...form, [f.key]: e.target.value })
                  }
                  className="hover-lift"
                  style={inputStyle}
                />
              </div>
            ))}
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
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="hover-lift"
                style={inputStyle}
              >
                {["High", "Medium", "Low"].map((p) => (
                  <option key={p}>{p}</option>
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
                Choose Icon
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setForm({ ...form, icon })}
                    className="hover-scale"
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      fontSize: "20px",
                      background:
                        form.icon === icon ? `${theme.primary}30` : theme.bg,
                      border: `2px solid ${form.icon === icon ? theme.primary : theme.border}`,
                      cursor: "pointer",
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
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
              Create Goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Goals;
