import React, { useEffect, useRef, useState } from "react";
import {
  User,
  Lock,
  Bell,
  Database,
  Info,
  Upload,
  Download,
  Save,
  Trash2,
  Moon,
  Sun,
} from "lucide-react";

import Navbar from "../components/Navbar.jsx";
import API from "../utils/api";
import { useData } from "../context/DataContext";

const DEFAULT_PREFS = {
  currency: "₹ INR",
  language: "English",
  dateFormat: "DD/MM/YYYY",
};

const DEFAULT_NOTIFICATIONS = {
  budget: true,
  recurring: true,
  goals: true,
  email: false,
};

const readStoredObject = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value && typeof value === "object" ? value : fallback;
  } catch {
    return fallback;
  }
};

const Settings = ({ isDarkMode, setIsDarkMode }) => {
  const { transactions, refreshData } = useData();

  const photoInputRef = useRef(null);
  const importInputRef = useRef(null);
  const toastTimerRef = useRef(null);

  const [activeSection, setActiveSection] = useState("Profile");
  const [savedMessage, setSavedMessage] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  const [profile, setProfile] = useState({
    name: localStorage.getItem("userName") || "User",
    email: localStorage.getItem("userEmail") || "",
    phone: localStorage.getItem("userPhone") || "",
  });

  const [photoPreview, setPhotoPreview] = useState(
    () => localStorage.getItem("userPhoto") || "",
  );

  const [prefs, setPrefs] = useState(() => ({
    ...DEFAULT_PREFS,
    ...readStoredObject("splitmate_preferences", {}),
  }));

  const [notifs, setNotifs] = useState(() => ({
    ...DEFAULT_NOTIFICATIONS,
    ...readStoredObject("splitmate_notification_preferences", {}),
  }));

  const [passwords, setPasswords] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const theme = {
    bg: isDarkMode ? "#0a0f1e" : "#f1f5f9",
    card: isDarkMode ? "#111827" : "#ffffff",
    border: isDarkMode ? "#26334b" : "#e2e8f0",
    text: isDarkMode ? "#f1f5f9" : "#1e293b",
    secondary: isDarkMode ? "#94a3b8" : "#64748b",
    primary: "#3b82f6",
    danger: "#ef4444",
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showSaved = (message = "Changes saved successfully.") => {
    setSavedMessage(message);

    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = setTimeout(() => {
      setSavedMessage("");
    }, 3000);
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    marginTop: 7,
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${theme.border}`,
    background: theme.bg,
    color: theme.text,
    fontSize: 14,
    outline: "none",
  };

  const buttonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: "11px 16px",
    border: 0,
    borderRadius: 10,
    background: theme.primary,
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: 13,
  };

  const cardStyle = {
    background: theme.card,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    overflow: "hidden",
    minWidth: 0,
  };

  const saveProfile = () => {
    const name = profile.name.trim();
    const email = profile.email.trim();

    if (!name || !email) {
      alert("Please enter your name and email address.");
      return;
    }

    try {
      localStorage.setItem("userName", name);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userPhone", profile.phone.trim());

      setProfile({ ...profile, name, email });

      window.dispatchEvent(new Event("splitmate-profile-updated"));
      showSaved("Profile updated successfully.");
    } catch (error) {
      console.error("Profile save failed:", error);
      alert("Could not save your profile. Please check browser storage.");
    }
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Please select an image smaller than 2MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const photo = reader.result;

        localStorage.setItem("userPhoto", photo);
        setPhotoPreview(photo);
        window.dispatchEvent(new Event("splitmate-profile-updated"));

        showSaved("Profile photo updated.");
      } catch (error) {
        console.error("Photo save failed:", error);
        alert("Could not save the image. Please try a smaller image.");
      } finally {
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      alert("Unable to read the selected image.");
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const savePreferences = () => {
    try {
      localStorage.setItem("splitmate_preferences", JSON.stringify(prefs));
      showSaved("App preferences saved.");
    } catch (error) {
      console.error("Preference save failed:", error);
      alert("Could not save preferences.");
    }
  };

  const updateNotificationPreference = (key, checked) => {
    const next = { ...notifs, [key]: checked };

    setNotifs(next);

    try {
      localStorage.setItem(
        "splitmate_notification_preferences",
        JSON.stringify(next),
      );
    } catch (error) {
      console.error("Notification preference save failed:", error);
      alert("Could not save notification preferences.");
    }
  };

  const updateThemePreference = (value) => {
    if (value === "Dark") setIsDarkMode(true);
    if (value === "Light") setIsDarkMode(false);

    setPrefs((previous) => ({ ...previous, theme: value }));
  };

  const exportCSV = () => {
    if (!transactions.length) {
      alert("There are no transactions to export.");
      return;
    }

    const headers = ["Description", "Category", "Amount", "Date"];

    const escapeCSV = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;

    const rows = transactions.map((tx) => [
      tx.name || tx.description || "",
      tx.category || "Other",
      Math.abs(Number(tx.amount) || 0),
      tx.rawDate || tx.date || "",
    ]);

    const csv = [
      headers.map(escapeCSV).join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\r\n");

    downloadFile(
      csv,
      `splitmate_transactions_${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv;charset=utf-8;",
    );

    showSaved("CSV export downloaded.");
  };

  const exportJSON = async () => {
    try {
      setBusy(true);

      const [goalsRes, budgetsRes, owedRes] = await Promise.all([
        API.get("/goals"),
        API.get("/budgets"),
        API.get("/owed"),
      ]);

      const backup = {
        exportedAt: new Date().toISOString(),
        transactions,
        goals: goalsRes.data,
        budgets: budgetsRes.data,
        owed: owedRes.data,
        profile,
        preferences: prefs,
        notificationPreferences: notifs,
      };

      downloadFile(
        JSON.stringify(backup, null, 2),
        `splitmate_backup_${new Date().toISOString().slice(0, 10)}.json`,
        "application/json",
      );

      showSaved("JSON backup downloaded.");
    } catch (error) {
      console.error("JSON export failed:", error);
      alert(
        "Could not export data. Please check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleImportCSV = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const text = String(reader.result || "");
        const lines = text.split(/\r?\n/).filter((line) => line.trim());

        if (lines.length < 2) {
          alert("The CSV file has no transaction rows.");
          return;
        }

        // This importer expects: Description, Category, Amount, Date.
        // It supports quoted fields and escaped double quotes.
        const parseLine = (line) => {
          const values = [];
          let value = "";
          let quoted = false;

          for (let i = 0; i < line.length; i += 1) {
            const char = line[i];

            if (char === '"' && quoted && line[i + 1] === '"') {
              value += '"';
              i += 1;
            } else if (char === '"') {
              quoted = !quoted;
            } else if (char === "," && !quoted) {
              values.push(value.trim());
              value = "";
            } else {
              value += char;
            }
          }

          values.push(value.trim());
          return values;
        };

        const headers = parseLine(lines[0]).map((header) =>
          header.toLowerCase(),
        );

        const descriptionIndex = headers.findIndex((h) =>
          ["description", "name"].includes(h),
        );
        const categoryIndex = headers.indexOf("category");
        const amountIndex = headers.indexOf("amount");
        const dateIndex = headers.indexOf("date");

        if (descriptionIndex < 0 || amountIndex < 0) {
          alert(
            "CSV headers must include Description (or Name) and Amount. Category and Date are recommended.",
          );
          return;
        }

        const rows = lines.slice(1).map(parseLine);

        const imported = rows
          .map((parts) => {
            const amount = Number(parts[amountIndex]);
            const description = parts[descriptionIndex]?.trim();

            return {
              description,
              amount: Math.abs(amount),
              category:
                categoryIndex >= 0 ? parts[categoryIndex] || "Other" : "Other",
              date:
                dateIndex >= 0 && parts[dateIndex]
                  ? parts[dateIndex]
                  : new Date().toISOString().slice(0, 10),
            };
          })
          .filter(
            (tx) =>
              tx.description && Number.isFinite(tx.amount) && tx.amount > 0,
          );

        if (!imported.length) {
          alert("No valid transactions were found in the CSV.");
          return;
        }

        setBusy(true);

        // Import in sequence to avoid sending too many requests at once.
        for (const transaction of imported) {
          await API.post("/expenses", transaction);
        }

        await refreshData();
        showSaved(`${imported.length} transactions imported.`);
      } catch (error) {
        console.error("CSV import failed:", error);
        alert(
          "Import was interrupted. Some transactions may already have been imported. Check your transactions before retrying.",
        );
      } finally {
        setBusy(false);
        event.target.value = "";
      }
    };

    reader.onerror = () => {
      alert("Unable to read this CSV file.");
      event.target.value = "";
    };

    reader.readAsText(file);
  };

  const clearTransactions = async () => {
    try {
      setBusy(true);

      const response = await API.get("/expenses");
      const expenses = Array.isArray(response.data) ? response.data : [];

      for (const tx of expenses) {
        const id = tx.id || tx._id;

        if (id) {
          await API.delete(`/expenses/${id}`);
        }
      }

      await refreshData();
      setClearConfirm(false);
      showSaved("Transactions cleared.");
    } catch (error) {
      console.error("Clear transactions failed:", error);
      alert("Could not clear all transactions. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const validatePasswordForm = () => {
    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      setPasswordMessage("Please complete all password fields.");
      return;
    }

    if (passwords.newPass.length < 8) {
      setPasswordMessage("Your new password must be at least 8 characters.");
      return;
    }

    if (passwords.newPass !== passwords.confirm) {
      setPasswordMessage("The new passwords do not match.");
      return;
    }

    setPasswordMessage(
      "Password changes are not connected to the backend yet. No password was changed.",
    );
  };

  const sections = [
    { label: "Profile", icon: User },
    { label: "Account", icon: Lock },
    { label: "Preferences", icon: isDarkMode ? Moon : Sun },
    { label: "Notifications", icon: Bell },
    { label: "Data", icon: Database },
    { label: "About", icon: Info },
  ];

  const Field = ({ label, children }) => (
    <label
      style={{
        display: "block",
        minWidth: 0,
        fontSize: 13,
        color: theme.secondary,
        fontWeight: 700,
      }}
    >
      {label}
      {children}
    </label>
  );

  const Panel = ({ title, subtitle, children }) => (
    <section style={cardStyle}>
      <header
        style={{
          padding: "22px 24px",
          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <h2 style={{ fontSize: 17, margin: 0, fontWeight: 800 }}>{title}</h2>
        {subtitle && (
          <p
            style={{ color: theme.secondary, fontSize: 13, margin: "6px 0 0" }}
          >
            {subtitle}
          </p>
        )}
      </header>
      <div style={{ padding: 24 }}>{children}</div>
    </section>
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
        color: theme.text,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      {savedMessage && (
        <div
          role="status"
          style={{
            position: "fixed",
            right: 20,
            top: 85,
            zIndex: 500,
            padding: "13px 18px",
            borderRadius: 12,
            color: "#ffffff",
            background: "#059669",
            boxShadow: "0 8px 24px #0002",
            maxWidth: "calc(100vw - 40px)",
          }}
        >
          {savedMessage}
        </div>
      )}

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "32px 20px 48px",
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 850 }}>Settings</h1>
          <p style={{ color: theme.secondary, marginTop: 7 }}>
            Manage your profile, preferences, notifications, and data.
          </p>
        </div>

        <div
          className="settings-layout"
          style={{
            display: "grid",
            gridTemplateColumns: "230px minmax(0, 1fr)",
            gap: 22,
            alignItems: "start",
          }}
        >
          <aside
            style={{
              ...cardStyle,
              padding: 8,
              display: "flex",
              flexDirection: "column",
              gap: 3,
            }}
          >
            {sections.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveSection(label)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 10,
                  border: 0,
                  background:
                    activeSection === label
                      ? `${theme.primary}20`
                      : "transparent",
                  color:
                    activeSection === label ? theme.primary : theme.secondary,
                  fontWeight: 700,
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <Icon size={17} />
                {label}
              </button>
            ))}
          </aside>

          <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
            {activeSection === "Profile" && (
              <Panel
                title="Profile information"
                subtitle="Update the details displayed in your account menu."
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 18,
                    flexWrap: "wrap",
                    marginBottom: 24,
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Your profile"
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: "50%",
                        objectFit: "cover",
                        border: `2px solid ${theme.primary}`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 84,
                        height: 84,
                        borderRadius: "50%",
                        display: "grid",
                        placeItems: "center",
                        background: "linear-gradient(135deg,#3b82f6,#8b5cf6)",
                        color: "white",
                        fontSize: 30,
                        fontWeight: 800,
                      }}
                    >
                      {(profile.name.charAt(0) || "U").toUpperCase()}
                    </div>
                  )}

                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      style={{ display: "none" }}
                    />
                    <button
                      type="button"
                      style={buttonStyle}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      <Upload size={16} /> Upload photo
                    </button>
                    <p style={{ color: theme.secondary, fontSize: 12 }}>
                      JPG, PNG, or another supported image type. Maximum 2MB.
                    </p>
                  </div>
                </div>

                <div
                  className="settings-fields"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 18,
                  }}
                >
                  <Field label="Full name">
                    <input
                      style={inputStyle}
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({ ...profile, name: e.target.value })
                      }
                      autoComplete="name"
                    />
                  </Field>

                  <Field label="Phone number">
                    <input
                      style={inputStyle}
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({ ...profile, phone: e.target.value })
                      }
                      autoComplete="tel"
                    />
                  </Field>

                  <div style={{ gridColumn: "1 / -1" }}>
                    <Field label="Email address">
                      <input
                        style={inputStyle}
                        type="email"
                        value={profile.email}
                        onChange={(e) =>
                          setProfile({ ...profile, email: e.target.value })
                        }
                        autoComplete="email"
                      />
                    </Field>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={saveProfile}
                  style={{ ...buttonStyle, marginTop: 22 }}
                >
                  <Save size={16} /> Save profile
                </button>
              </Panel>
            )}

            {activeSection === "Account" && (
              <Panel
                title="Account and security"
                subtitle="Password changes require a backend endpoint."
              >
                <h3 style={{ marginTop: 0, fontSize: 15 }}>Change password</h3>

                {[
                  { label: "Current password", key: "current" },
                  { label: "New password", key: "newPass" },
                  { label: "Confirm new password", key: "confirm" },
                ].map((field) => (
                  <div key={field.key} style={{ marginBottom: 15 }}>
                    <Field label={field.label}>
                      <input
                        style={inputStyle}
                        type="password"
                        autoComplete="off"
                        value={passwords[field.key]}
                        onChange={(e) => {
                          setPasswords({
                            ...passwords,
                            [field.key]: e.target.value,
                          });
                          setPasswordMessage("");
                        }}
                      />
                    </Field>
                  </div>
                ))}

                {passwordMessage && (
                  <p style={{ color: theme.secondary, fontSize: 13 }}>
                    {passwordMessage}
                  </p>
                )}

                <button
                  type="button"
                  onClick={validatePasswordForm}
                  style={buttonStyle}
                >
                  Validate password form
                </button>

                <div
                  style={{
                    borderTop: `1px solid ${theme.border}`,
                    marginTop: 28,
                    paddingTop: 22,
                  }}
                >
                  <h3 style={{ color: theme.danger, marginTop: 0 }}>
                    Danger zone
                  </h3>
                  <p style={{ color: theme.secondary, fontSize: 13 }}>
                    This action permanently deletes your expense records. It
                    does not delete your account.
                  </p>

                  {!clearConfirm ? (
                    <button
                      type="button"
                      onClick={() => setClearConfirm(true)}
                      style={{
                        ...buttonStyle,
                        background: `${theme.danger}18`,
                        color: theme.danger,
                        border: `1px solid ${theme.danger}50`,
                      }}
                    >
                      <Trash2 size={16} /> Clear all transactions
                    </button>
                  ) : (
                    <div
                      style={{
                        padding: 16,
                        borderRadius: 12,
                        border: `1px solid ${theme.danger}70`,
                      }}
                    >
                      <strong>Are you sure?</strong>
                      <p style={{ color: theme.secondary, fontSize: 13 }}>
                        Export a backup first if you need to keep these records.
                      </p>
                      <div
                        style={{ display: "flex", gap: 10, flexWrap: "wrap" }}
                      >
                        <button
                          type="button"
                          disabled={busy}
                          onClick={clearTransactions}
                          style={{ ...buttonStyle, background: theme.danger }}
                        >
                          {busy ? "Working..." : "Yes, clear transactions"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setClearConfirm(false)}
                          style={{
                            ...buttonStyle,
                            background: theme.border,
                            color: theme.text,
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            )}

            {activeSection === "Preferences" && (
              <Panel
                title="App preferences"
                subtitle="Customize your local SplitMate experience."
              >
                <div
                  className="settings-fields"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    gap: 18,
                  }}
                >
                  <Field label="Currency">
                    <select
                      style={inputStyle}
                      value={prefs.currency}
                      onChange={(e) =>
                        setPrefs({ ...prefs, currency: e.target.value })
                      }
                    >
                      {["₹ INR", "$ USD", "€ EUR", "£ GBP"].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Language">
                    <select
                      style={inputStyle}
                      value={prefs.language}
                      onChange={(e) =>
                        setPrefs({ ...prefs, language: e.target.value })
                      }
                    >
                      {["English", "Telugu", "Hindi", "Tamil"].map((option) => (
                        <option key={option}>{option}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Date format">
                    <select
                      style={inputStyle}
                      value={prefs.dateFormat}
                      onChange={(e) =>
                        setPrefs({ ...prefs, dateFormat: e.target.value })
                      }
                    >
                      {["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"].map(
                        (option) => (
                          <option key={option}>{option}</option>
                        ),
                      )}
                    </select>
                  </Field>

                  <Field label="Theme">
                    <select
                      style={inputStyle}
                      value={isDarkMode ? "Dark" : "Light"}
                      onChange={(e) => updateThemePreference(e.target.value)}
                    >
                      <option>Dark</option>
                      <option>Light</option>
                    </select>
                  </Field>
                </div>

                <button
                  type="button"
                  onClick={savePreferences}
                  style={{ ...buttonStyle, marginTop: 22 }}
                >
                  <Save size={16} /> Save preferences
                </button>

                <p style={{ color: theme.secondary, fontSize: 12 }}>
                  Currency, language, and date format are saved as preferences.
                  Applying them across every page requires updating those pages
                  to read these settings.
                </p>
              </Panel>
            )}

            {activeSection === "Notifications" && (
              <Panel
                title="Notification preferences"
                subtitle="Choose which in-app alerts you want enabled."
              >
                {[
                  {
                    key: "budget",
                    title: "Budget alerts",
                    description:
                      "Show alerts when spending approaches a budget limit.",
                  },
                  {
                    key: "recurring",
                    title: "Recurring payment reminders",
                    description:
                      "Enable the preference for upcoming payment reminders.",
                  },
                  {
                    key: "goals",
                    title: "Savings goal alerts",
                    description: "Show alerts about savings goal progress.",
                  },
                  {
                    key: "email",
                    title: "Email notifications",
                    description:
                      "Preference only. Email delivery is not configured.",
                  },
                ].map((item, index, array) => (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16,
                      padding: "18px 0",
                      borderBottom:
                        index < array.length - 1
                          ? `1px solid ${theme.border}`
                          : "none",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14 }}>{item.title}</strong>
                      <p
                        style={{
                          margin: "5px 0 0",
                          color: theme.secondary,
                          fontSize: 12,
                          lineHeight: 1.6,
                        }}
                      >
                        {item.description}
                      </p>
                    </div>

                    <input
                      type="checkbox"
                      checked={Boolean(notifs[item.key])}
                      onChange={(e) =>
                        updateNotificationPreference(item.key, e.target.checked)
                      }
                      aria-label={item.title}
                      style={{
                        width: 19,
                        height: 19,
                        accentColor: theme.primary,
                        flexShrink: 0,
                        cursor: "pointer",
                      }}
                    />
                  </div>
                ))}
              </Panel>
            )}

            {activeSection === "Data" && (
              <Panel
                title="Data management"
                subtitle="Download a backup or import transactions."
              >
                <div style={{ display: "grid", gap: 16 }}>
                  <div>
                    <strong>Export transactions as CSV</strong>
                    <p style={{ color: theme.secondary, fontSize: 13 }}>
                      Download your transaction list as a spreadsheet.
                    </p>
                    <button
                      type="button"
                      onClick={exportCSV}
                      style={buttonStyle}
                    >
                      <Download size={16} /> Export CSV
                    </button>
                  </div>

                  <div
                    style={{
                      borderTop: `1px solid ${theme.border}`,
                      paddingTop: 16,
                    }}
                  >
                    <strong>Export full backup as JSON</strong>
                    <p style={{ color: theme.secondary, fontSize: 13 }}>
                      Download transactions, budgets, goals, owed records,
                      profile details, and preferences.
                    </p>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={exportJSON}
                      style={buttonStyle}
                    >
                      <Download size={16} />{" "}
                      {busy ? "Exporting..." : "Export JSON"}
                    </button>
                  </div>

                  <div
                    style={{
                      borderTop: `1px solid ${theme.border}`,
                      paddingTop: 16,
                    }}
                  >
                    <strong>Import transactions from CSV</strong>
                    <p style={{ color: theme.secondary, fontSize: 13 }}>
                      Expected columns: Description, Category, Amount, Date.
                      Imported rows are added to your account.
                    </p>

                    <input
                      ref={importInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleImportCSV}
                      style={{ display: "none" }}
                    />

                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => importInputRef.current?.click()}
                      style={buttonStyle}
                    >
                      <Upload size={16} />{" "}
                      {busy ? "Importing..." : "Import CSV"}
                    </button>
                  </div>
                </div>
              </Panel>
            )}

            {activeSection === "About" && (
              <Panel
                title="About SplitMate"
                subtitle="Personal finance and expense management."
              >
                <h3 style={{ marginTop: 0 }}>SplitMate</h3>
                <p style={{ color: theme.secondary, lineHeight: 1.8 }}>
                  Track expenses, manage budgets, organize savings goals, and
                  review your financial activity in one place.
                </p>

                <div
                  style={{
                    padding: 16,
                    background: theme.bg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: 12,
                  }}
                >
                  <strong>Current capabilities</strong>
                  <ul style={{ color: theme.secondary, lineHeight: 1.9 }}>
                    <li>Expense and budget management</li>
                    <li>Savings goals and activity history</li>
                    <li>Light and dark themes</li>
                    <li>CSV and JSON data exports</li>
                    <li>In-app financial alerts based on available data</li>
                  </ul>
                </div>
              </Panel>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default Settings;
