import React, { useState, useEffect } from "react";

import { Search } from "lucide-react";

import Navbar from "../components/Navbar.jsx";

import { useData } from "../context/DataContext";

const tabs = ["All", "Expenses", "Settlements", "Goals", "System"];

const typeColors = {
  Expenses: "#F43F5E",

  Settlements: "#10B981",

  Goals: "#F59E0B",

  System: "#8B5CF6",
};

const ITEMS_PER_PAGE = 8;

const Activity = ({ isDarkMode, setIsDarkMode }) => {
  const { transactions, goals, owedList, loading: dataLoading } = useData();

  const [activities, setActivities] = useState([]);

  const [activeTab, setActiveTab] = useState("All");

  const [search, setSearch] = useState("");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(true);

  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(true);
  }, []);

  useEffect(() => {
    if (!dataLoading) {
      buildActivities();
    }
  }, [transactions, goals, owedList, dataLoading]);

  const buildActivities = () => {
    const expenseActivities = (transactions || []).map((tx) => ({
      id: tx.id || tx._id,

      type: "Expenses",

      icon: tx.icon || "💸",

      title: `Added expense: ${tx.name || tx.description}`,

      amount: tx.amount,

      time: tx.date,

      date: tx.rawDate,
    }));

    const goalActivities = (goals || []).map((goal) => ({
      id: goal._id,

      type: "Goals",

      icon: goal.icon || "🎯",

      title:
        goal.saved >= goal.target
          ? `Completed goal: ${goal.name}`
          : `Added money to ${goal.name}`,

      amount: null,

      time: new Date(goal.createdAt).toLocaleDateString("en-IN"),

      date: goal.createdAt,
    }));

    const settlementActivities = (owedList || [])

      .filter((owed) => owed.settled)

      .map((owed) => ({
        id: owed._id,

        type: "Settlements",

        icon: "🤝",

        title: `${owed.name} paid you ₹${owed.amount}`,

        amount: owed.amount,

        time: new Date(owed.date).toLocaleDateString("en-IN"),

        date: owed.date,
      }));

    const allActivities = [
      ...expenseActivities,

      ...goalActivities,

      ...settlementActivities,
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    setActivities(allActivities);

    setLoading(false);
  };

  const theme = {
    bg: isDarkMode ? "#0A0F1E" : "#F1F5F9",

    card: isDarkMode ? "#111827" : "#FFFFFF",

    border: isDarkMode ? "#1E2D45" : "#E2E8F0",

    text: isDarkMode ? "#F1F5F9" : "#1E293B",

    secondary: isDarkMode ? "#94A3B8" : "#64748B",

    primary: "#3B82F6",
  };

  const filtered = activities

    .filter((a) => activeTab === "All" || a.type === activeTab)

    .filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,

    page * ITEMS_PER_PAGE,
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);

    setPage(1);
  };

  if (loading || dataLoading) {
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
          Loading activities...
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
        className="activity-main"
        style={{
          padding: "clamp(16px, 4vw, 36px) clamp(12px, 4vw, 40px)",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >
        <div className="animate-fadeInUp" style={{ marginBottom: "28px" }}>
          <h1
            style={{
              fontSize: "28px",

              fontWeight: "800",

              margin: 0,

              fontFamily: "'Inter', sans-serif",
            }}
          >
            Activity Feed
          </h1>

          <p
            style={{
              color: theme.secondary,

              margin: "4px 0 0 0",

              fontSize: "14px",

              fontFamily: "'Inter', sans-serif",
            }}
          >
            Everything that happened in your account
          </p>
        </div>

        <div
          style={{
            display: "flex",

            justifyContent: "space-between",

            alignItems: "center",

            marginBottom: "20px",

            flexWrap: "wrap",

            gap: "12px",
          }}
        >
          <div
            className="activity-tabs"
            role="tablist"
            aria-label="Activity categories"
            style={{
              display: "flex",

              gap: "4px",

              background: theme.card,

              padding: "4px",

              borderRadius: "12px",

              border: `1px solid ${theme.border}`,

              maxWidth: "100%",

              minWidth: 0,

              overflowX: "auto",

              WebkitOverflowScrolling: "touch",

              flex: "1 1 100%",
              width: "100%",
              justifyContent: "flex-start",
              flexWrap: "nowrap",
              scrollbarWidth: "none",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className="hover-scale"
                style={{
                  background: activeTab === tab ? theme.primary : "transparent",

                  color: activeTab === tab ? "white" : theme.secondary,

                  border: "none",

                  padding: "7px 16px",

                  borderRadius: "9px",

                  cursor: "pointer",

                  fontWeight: "700",

                  fontSize: "13px",

                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div
            className="activity-search"
            style={{
              position: "relative",
              width: "min(100%, 280px)",
              minWidth: 0,
              flex: "1 1 220px",
            }}
          >
            <Search
              size={16}
              style={{
                position: "absolute",

                left: "12px",

                top: "50%",

                transform: "translateY(-50%)",

                color: theme.secondary,
              }}
            />

            <input
              type="text"
              placeholder="Search activity..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);

                setPage(1);
              }}
              className="hover-lift"
              style={{
                paddingLeft: "36px",

                paddingRight: "14px",

                paddingTop: "10px",

                paddingBottom: "10px",

                background: theme.card,

                border: `1px solid ${theme.border}`,

                borderRadius: "10px",

                color: theme.text,

                fontSize: "13px",

                outline: "none",

                width: "100%",

                boxSizing: "border-box",

                fontFamily: "'Inter', sans-serif",
              }}
            />
          </div>
        </div>

        <div
          style={{
            backgroundColor: theme.card,

            borderRadius: "20px",

            border: `1px solid ${theme.border}`,

            overflow: "hidden",
          }}
        >
          {paginated.length === 0 ? (
            <div
              style={{
                padding: "60px",

                textAlign: "center",

                color: theme.secondary,
              }}
            >
              <p style={{ fontSize: "40px", margin: "0 0 12px 0" }}>🔍</p>

              <p
                style={{
                  fontWeight: "600",

                  margin: 0,

                  fontFamily: "'Inter', sans-serif",
                }}
              >
                No activity found
              </p>
            </div>
          ) : (
            paginated.map((act, idx) => (
              <div
                key={act.id ?? `${act.type}-${idx}`}
                className="activity-item hover-lift"
                style={{
                  display: "flex",

                  justifyContent: "space-between",

                  alignItems: "center",

                  gap: 12,

                  minWidth: 0,

                  padding: "18px 28px",

                  borderBottom:
                    idx < paginated.length - 1
                      ? `1px solid ${theme.border}`
                      : "none",

                  transition: "background 0.15s",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "16px" }}
                >
                  <div
                    style={{
                      width: "44px",

                      height: "44px",

                      borderRadius: "12px",

                      background: `${typeColors[act.type]}15`,

                      display: "flex",

                      alignItems: "center",

                      justifyContent: "center",

                      fontSize: "20px",

                      flexShrink: 0,
                    }}
                  >
                    {act.icon}
                  </div>

                  <div>
                    <p
                      style={{
                        margin: 0,

                        fontWeight: "600",

                        fontSize: "14px",

                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {act.title}
                    </p>

                    <div
                      style={{
                        display: "flex",

                        alignItems: "center",

                        gap: "8px",

                        marginTop: "3px",
                      }}
                    >
                      <span
                        style={{
                          background: `${typeColors[act.type]}20`,

                          color: typeColors[act.type],

                          fontSize: "11px",

                          padding: "1px 8px",

                          borderRadius: "20px",

                          fontWeight: "700",

                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {act.type}
                      </span>

                      <span
                        style={{
                          fontSize: "12px",

                          color: theme.secondary,

                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        {act.time}
                      </span>
                    </div>
                  </div>
                </div>

                {act.amount !== null && (
                  <span
                    style={{
                      fontWeight: "700",

                      fontSize: "15px",

                      color: act.amount > 0 ? "#10B981" : "#F43F5E",

                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {act.amount > 0 ? "+" : ""}₹
                    {Math.abs(act.amount).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {totalPages > 1 && (
          <div
            style={{
              display: "flex",

              justifyContent: "center",

              gap: "8px",

              marginTop: "24px",
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="hover-scale"
              style={{
                padding: "8px 16px",

                borderRadius: "8px",

                background: page === 1 ? theme.border : `${theme.primary}20`,

                color: page === 1 ? theme.secondary : theme.primary,

                border: "none",

                cursor: page === 1 ? "not-allowed" : "pointer",

                fontWeight: "700",

                fontFamily: "'Inter', sans-serif",
              }}
            >
              ← Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className="hover-scale"
                style={{
                  padding: "8px 14px",

                  borderRadius: "8px",

                  background: page === p ? theme.primary : "transparent",

                  color: page === p ? "white" : theme.secondary,

                  border: `1px solid ${page === p ? theme.primary : theme.border}`,

                  cursor: "pointer",

                  fontWeight: "700",

                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="hover-scale"
              style={{
                padding: "8px 16px",

                borderRadius: "8px",

                background:
                  page === totalPages ? theme.border : `${theme.primary}20`,

                color: page === totalPages ? theme.secondary : theme.primary,

                border: "none",

                cursor: page === totalPages ? "not-allowed" : "pointer",

                fontWeight: "700",

                fontFamily: "'Inter', sans-serif",
              }}
            >
              Next →
            </button>
          </div>
        )}
      </main>

      <style>{`
        .activity-main,
        .activity-main * {
          min-width: 0;
        }

        .activity-tabs {
          scrollbar-width: none;
          -ms-overflow-style: none;
          overscroll-behavior-x: contain;
        }

        .activity-tabs::-webkit-scrollbar {
          display: none;
        }

        .activity-tabs button {
          flex: 0 0 auto !important;
          flex-shrink: 0 !important;
          white-space: nowrap !important;
        }

        .activity-item > div:first-child {
          min-width: 0;
          flex: 1 1 auto;
        }

        .activity-item > div:first-child > div:last-child {
          min-width: 0;
        }

        .activity-item p {
          overflow-wrap: anywhere;
        }

        @media (max-width: 760px) {
          .activity-main {
            padding: 28px 20px !important;
          }
        }

        @media (max-width: 480px) {
          .activity-main {
            padding: 24px 12px !important;
          }

          .activity-tabs {
            width: 100% !important;
            flex: 1 1 100% !important;
            gap: 6px !important;
          }

          .activity-tabs button {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }

          .activity-main h1 {
            font-size: 26px !important;
          }

          .activity-item {
            padding: 16px 14px !important;
            align-items: flex-start !important;
          }

          .activity-item > div:first-child {
            gap: 10px !important;
          }

          .activity-item > span {
            flex: 0 0 auto;
            font-size: 13px !important;
            white-space: nowrap;
          }

          .activity-search {
            flex-basis: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Activity;
