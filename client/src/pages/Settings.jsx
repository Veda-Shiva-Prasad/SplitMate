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
  Sun,
} from "lucide-react";

import Navbar from "../components/Navbar.jsx";

import API from "../utils/api";

import { useData } from "../context/DataContext";

const DEFAULT_PREFS = {
  currency: "₹ INR",

  language: "English",

  dateFormat: "DD/MM/YYYY",

  theme: "Light",
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

    return value && typeof value === "object" && value !== null
      ? value
      : fallback;
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
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await API.get("/auth/me");

        const user =
          response.data?.user || response.data?.data || response.data || {};

        if (!active) return;

        const nextProfile = {
          name: user.name || localStorage.getItem("userName") || "User",

          email: user.email || localStorage.getItem("userEmail") || "",

          phone: user.phone || localStorage.getItem("userPhone") || "",
        };

        const photo =
          user.profilePhoto || localStorage.getItem("userPhoto") || "";

        setProfile(nextProfile);

        setPhotoPreview(photo);

        localStorage.setItem("userName", nextProfile.name);

        localStorage.setItem("userEmail", nextProfile.email);

        localStorage.setItem("userPhone", nextProfile.phone);

        if (photo) {
          localStorage.setItem("userPhoto", photo);
        } else {
          localStorage.removeItem("userPhoto");
        }

        let storedUser = {};

        try {
          storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          storedUser = {};
        }

        localStorage.setItem(
          "user",

          JSON.stringify({
            ...storedUser,

            ...user,

            ...nextProfile,

            profilePhoto: photo,
          }),
        );

        window.dispatchEvent(new Event("splitmate-profile-updated"));
      } catch (error) {
        console.error("Could not load profile from server:", error);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

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

  const saveProfile = async () => {
    const name = profile.name.trim();

    const email = profile.email.trim().toLowerCase();

    const phone = profile.phone.trim();

    if (!name || !email) {
      alert("Please enter your name and email address.");

      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert("Please enter a valid email address.");

      return;
    }

    try {
      setBusy(true);

      const response = await API.put("/auth/profile", {
        name,

        email,

        phone,
      });

      const updated =
        response.data?.user || response.data?.data || response.data || {};

      const nextProfile = {
        name: updated.name ?? name,

        email: updated.email ?? email,

        phone: updated.phone ?? phone,
      };

      localStorage.setItem("userName", nextProfile.name);

      localStorage.setItem("userEmail", nextProfile.email);

      localStorage.setItem("userPhone", nextProfile.phone || "");

      let storedUser = {};

      try {
        storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      } catch {
        storedUser = {};
      }

      localStorage.setItem(
        "user",

        JSON.stringify({
          ...storedUser,

          ...updated,

          ...nextProfile,

          profilePhoto: updated.profilePhoto ?? photoPreview,
        }),
      );

      setProfile(nextProfile);

      window.dispatchEvent(new Event("splitmate-profile-updated"));

      showSaved("Profile updated successfully.");
    } catch (error) {
      console.error("Profile save failed:", error);

      alert(
        error.response?.data?.message ||
          "Could not save your profile. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const input = event.target;

    const file = input.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");

      input.value = "";

      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Please select an image smaller than 2MB.");

      input.value = "";

      return;
    }

    const reader = new FileReader();

    reader.onload = async () => {
      try {
        setBusy(true);

        const photo = String(reader.result || "");

        const response = await API.put("/auth/profile", {
          profilePhoto: photo,
        });

        const updated =
          response.data?.user || response.data?.data || response.data || {};

        const savedPhoto = updated.profilePhoto || photo;

        localStorage.setItem("userPhoto", savedPhoto);

        let storedUser = {};

        try {
          storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        } catch {
          storedUser = {};
        }

        localStorage.setItem(
          "user",

          JSON.stringify({
            ...storedUser,

            ...updated,

            profilePhoto: savedPhoto,
          }),
        );

        setPhotoPreview(savedPhoto);

        window.dispatchEvent(new Event("splitmate-profile-updated"));

        showSaved("Profile photo updated.");
      } catch (error) {
        console.error("Photo save failed:", error);

        alert(
          error.response?.data?.message ||
            "Could not save the image. Please try a smaller image.",
        );
      } finally {
        setBusy(false);

        input.value = "";
      }
    };

    reader.onerror = () => {
      alert("Unable to read the selected image.");

      input.value = "";
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
    if (typeof setIsDarkMode === "function") {
      if (value === "Dark") setIsDarkMode(true);

      if (value === "Light") setIsDarkMode(false);
    }

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

  const handleImport = async (event) => {
    const input = event.target;

    const file = input.files?.[0];

    if (!file) return;

    try {
      setBusy(true);

      const content = await file.text();

      let importedTransactions = [];

      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(content);

        importedTransactions = Array.isArray(parsed)
          ? parsed
          : parsed.transactions;

        if (!Array.isArray(importedTransactions)) {
          throw new Error(
            "The JSON file does not contain a transactions array.",
          );
        }
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        const lines = content

          .split(/\r?\n/)

          .filter((line) => line.trim() !== "");

        if (lines.length < 2) {
          throw new Error("The CSV file contains no transaction rows.");
        }

        const parseCSVRow = (line) => {
          const values = [];

          let value = "";

          let quoted = false;

          for (let i = 0; i < line.length; i += 1) {
            const char = line[i];

            if (char === '"' && line[i + 1] === '"' && quoted) {
              value += '"';

              i += 1;
            } else if (char === '"') {
              quoted = !quoted;
            } else if (char === "," && !quoted) {
              values.push(value);

              value = "";
            } else {
              value += char;
            }
          }

          values.push(value);

          return values;
        };

        const headers = parseCSVRow(lines[0]).map((header) =>
          header.trim().toLowerCase(),
        );

        const descriptionIndex = headers.findIndex(
          (header) =>
            header === "description" || header === "name" || header === "title",
        );

        const categoryIndex = headers.findIndex(
          (header) => header === "category",
        );

        const amountIndex = headers.findIndex((header) => header === "amount");

        const dateIndex = headers.findIndex((header) => header === "date");

        if (amountIndex === -1) {
          throw new Error("The CSV file must contain an Amount column.");
        }

        importedTransactions = lines.slice(1).map((line) => {
          const columns = parseCSVRow(line);

          const rawAmount = String(columns[amountIndex] ?? "")
            .replace(/[₹,$\s]/g, "")

            .trim();

          const amount = Number(rawAmount);

          if (!Number.isFinite(amount)) {
            throw new Error("The CSV file contains an invalid amount.");
          }

          return {
            name:
              descriptionIndex === -1
                ? "Imported transaction"
                : columns[descriptionIndex]?.trim() || "Imported transaction",

            category:
              categoryIndex === -1
                ? "Other"
                : columns[categoryIndex]?.trim() || "Other",

            amount: Math.abs(amount),

            date:
              dateIndex === -1
                ? new Date().toISOString().slice(0, 10)
                : columns[dateIndex]?.trim() ||
                  new Date().toISOString().slice(0, 10),
          };
        });
      } else {
        throw new Error("Please select a JSON or CSV file.");
      }

      if (importedTransactions.length === 0) {
        throw new Error("There are no transactions to import.");
      }

      const confirmed = window.confirm(
        `Import ${importedTransactions.length} transaction(s)? Existing transactions will not be deleted.`,
      );

      if (!confirmed) return;

      let importedCount = 0;

      for (const transaction of importedTransactions) {
        const normalizedTransaction = {
          ...transaction,

          name:
            transaction.name ||
            transaction.description ||
            "Imported transaction",

          category: transaction.category || "Other",

          amount: Math.abs(Number(transaction.amount) || 0),
        };

        delete normalizedTransaction._id;

        delete normalizedTransaction.id;

        delete normalizedTransaction.user;

        delete normalizedTransaction.userId;

        delete normalizedTransaction.createdAt;

        delete normalizedTransaction.updatedAt;

        await API.post("/transactions", normalizedTransaction);

        importedCount += 1;
      }

      await refreshData();

      showSaved(`${importedCount} transaction(s) imported successfully.`);
    } catch (error) {
      console.error("Transaction import failed:", error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Could not import transactions. Please check the file and try again.",
      );
    } finally {
      setBusy(false);

      input.value = "";
    }
  };

  const clearTransactions = async () => {
    if (!clearConfirm) {
      setClearConfirm(true);

      return;
    }

    try {
      setBusy(true);

      await API.delete("/transactions");

      await refreshData();

      setClearConfirm(false);

      showSaved("Transactions cleared successfully.");
    } catch (error) {
      console.error("Clearing transactions failed:", error);

      alert(
        error.response?.data?.message ||
          "Could not clear transactions. Please check the backend API.",
      );
    } finally {
      setBusy(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();

    setPasswordMessage("");

    if (!passwords.current || !passwords.newPass || !passwords.confirm) {
      setPasswordMessage("Please fill in all password fields.");

      return;
    }

    if (passwords.newPass.length < 8) {
      setPasswordMessage(
        "Your new password must contain at least 8 characters.",
      );

      return;
    }

    if (passwords.newPass !== passwords.confirm) {
      setPasswordMessage("The new passwords do not match.");

      return;
    }

    if (passwords.current === passwords.newPass) {
      setPasswordMessage(
        "Your new password must be different from your current password.",
      );

      return;
    }

    try {
      setBusy(true);

      await API.put("/auth/change-password", {
        currentPassword: passwords.current,

        newPassword: passwords.newPass,
      });

      setPasswords({
        current: "",

        newPass: "",

        confirm: "",
      });

      setPasswordMessage("Password changed successfully.");

      showSaved("Password changed successfully.");
    } catch (error) {
      console.error("Password change failed:", error);

      setPasswordMessage(
        error.response?.data?.message ||
          "Could not change your password. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  const Panel = ({ title, description, children }) => (
    <section style={cardStyle}>
      <div
        style={{
          padding: "20px 22px",

          borderBottom: `1px solid ${theme.border}`,
        }}
      >
        <h3
          style={{
            margin: 0,

            color: theme.text,

            fontSize: 17,

            fontWeight: 750,
          }}
        >
          {title}
        </h3>

        {description && (
          <p
            style={{
              margin: "7px 0 0",

              color: theme.secondary,

              fontSize: 13,

              lineHeight: 1.6,
            }}
          >
            {description}
          </p>
        )}
      </div>

      <div style={{ padding: 22 }}>{children}</div>
    </section>
  );

  const Field = ({
    label,

    value,

    onChange,

    type = "text",

    placeholder = "",

    autoComplete,
  }) => (
    <label
      style={{
        display: "block",

        color: theme.text,

        fontSize: 13,

        fontWeight: 650,

        minWidth: 0,
      }}
    >
      {label}

      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        style={inputStyle}
      />
    </label>
  );

  const sections = [
    { name: "Profile", icon: User },

    { name: "Security", icon: Lock },

    { name: "Preferences", icon: Sun },

    { name: "Notifications", icon: Bell },

    { name: "Data", icon: Database },

    { name: "About", icon: Info },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "Profile":
        return (
          <div style={{ display: "grid", gap: 20 }}>
            <Panel
              title="Profile Information"
              description="Manage your personal information and profile photo."
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
                <div
                  style={{
                    width: 86,

                    height: 86,

                    borderRadius: "50%",

                    overflow: "hidden",

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "center",

                    background: isDarkMode ? "#1e293b" : "#dbeafe",

                    color: theme.primary,

                    fontSize: 28,

                    fontWeight: 800,

                    flexShrink: 0,
                  }}
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile"
                      style={{
                        width: "100%",

                        height: "100%",

                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    (profile.name || "U").charAt(0).toUpperCase()
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 180 }}>
                  <h3
                    style={{
                      color: theme.text,

                      margin: "0 0 6px",

                      fontSize: 17,
                    }}
                  >
                    {profile.name || "Your profile"}
                  </h3>

                  <p
                    style={{
                      color: theme.secondary,

                      margin: "0 0 12px",

                      fontSize: 13,
                    }}
                  >
                    Upload a JPG, PNG, GIF, or WebP image under 2 MB.
                  </p>

                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/gif,image/webp"
                    onChange={handlePhotoUpload}
                    style={{ display: "none" }}
                  />

                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={busy}
                    style={buttonStyle}
                  >
                    <Upload size={16} />
                    Upload Photo
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "grid",

                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",

                  gap: 18,
                }}
              >
                <Field
                  label="Full Name"
                  value={profile.name}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  onChange={(event) =>
                    setProfile((previous) => ({
                      ...previous,

                      name: event.target.value,
                    }))
                  }
                />

                <Field
                  label="Email Address"
                  type="email"
                  value={profile.email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  onChange={(event) =>
                    setProfile((previous) => ({
                      ...previous,

                      email: event.target.value,
                    }))
                  }
                />

                <Field
                  label="Phone Number"
                  type="tel"
                  value={profile.phone}
                  placeholder="Enter phone number"
                  autoComplete="tel"
                  onChange={(event) =>
                    setProfile((previous) => ({
                      ...previous,

                      phone: event.target.value,
                    }))
                  }
                />
              </div>

              <div style={{ marginTop: 22 }}>
                <button
                  type="button"
                  onClick={saveProfile}
                  disabled={busy}
                  style={{
                    ...buttonStyle,

                    opacity: busy ? 0.65 : 1,
                  }}
                >
                  <Save size={16} />
                  Save Profile
                </button>
              </div>
            </Panel>
          </div>
        );

      case "Security":
        return (
          <Panel
            title="Change Password"
            description="Choose a strong password and keep your account secure."
          >
            <form onSubmit={changePassword}>
              <div style={{ display: "grid", gap: 18 }}>
                <Field
                  label="Current Password"
                  type="password"
                  value={passwords.current}
                  autoComplete="current-password"
                  placeholder="Enter current password"
                  onChange={(event) =>
                    setPasswords((previous) => ({
                      ...previous,

                      current: event.target.value,
                    }))
                  }
                />

                <Field
                  label="New Password"
                  type="password"
                  value={passwords.newPass}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  onChange={(event) =>
                    setPasswords((previous) => ({
                      ...previous,

                      newPass: event.target.value,
                    }))
                  }
                />

                <Field
                  label="Confirm New Password"
                  type="password"
                  value={passwords.confirm}
                  autoComplete="new-password"
                  placeholder="Re-enter new password"
                  onChange={(event) =>
                    setPasswords((previous) => ({
                      ...previous,

                      confirm: event.target.value,
                    }))
                  }
                />
              </div>

              {passwordMessage && (
                <p
                  role="status"
                  style={{
                    color: passwordMessage.includes("successfully")
                      ? "#16a34a"
                      : theme.danger,

                    fontSize: 13,

                    marginTop: 16,
                  }}
                >
                  {passwordMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                style={{
                  ...buttonStyle,

                  marginTop: 20,

                  opacity: busy ? 0.65 : 1,
                }}
              >
                <Lock size={16} />
                Change Password
              </button>
            </form>
          </Panel>
        );

      case "Preferences":
        return (
          <Panel
            title="Application Preferences"
            description="Customize how SplitMate looks and displays information."
          >
            <div style={{ display: "grid", gap: 22 }}>
              <label
                style={{
                  display: "block",

                  color: theme.text,

                  fontSize: 13,

                  fontWeight: 650,
                }}
              >
                Currency
                <select
                  value={prefs.currency}
                  onChange={(event) =>
                    setPrefs((previous) => ({
                      ...previous,

                      currency: event.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="₹ INR">Indian Rupee (₹ INR)</option>

                  <option value="$ USD">US Dollar ($ USD)</option>

                  <option value="€ EUR">Euro (€ EUR)</option>

                  <option value="£ GBP">British Pound (£ GBP)</option>
                </select>
              </label>

              <label
                style={{
                  display: "block",

                  color: theme.text,

                  fontSize: 13,

                  fontWeight: 650,
                }}
              >
                Language
                <select
                  value={prefs.language}
                  onChange={(event) =>
                    setPrefs((previous) => ({
                      ...previous,

                      language: event.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="English">English</option>
                </select>
              </label>

              <label
                style={{
                  display: "block",

                  color: theme.text,

                  fontSize: 13,

                  fontWeight: 650,
                }}
              >
                Date Format
                <select
                  value={prefs.dateFormat}
                  onChange={(event) =>
                    setPrefs((previous) => ({
                      ...previous,

                      dateFormat: event.target.value,
                    }))
                  }
                  style={inputStyle}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>

                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>

                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </label>

              <label
                style={{
                  display: "block",

                  color: theme.text,

                  fontSize: 13,

                  fontWeight: 650,
                }}
              >
                Appearance
                <select
                  value={prefs.theme || (isDarkMode ? "Dark" : "Light")}
                  onChange={(event) =>
                    updateThemePreference(event.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="Light">Light Mode</option>

                  <option value="Dark">Dark Mode</option>
                </select>
              </label>

              <div>
                <button
                  type="button"
                  onClick={savePreferences}
                  style={buttonStyle}
                >
                  <Save size={16} />
                  Save Preferences
                </button>
              </div>
            </div>
          </Panel>
        );

      case "Notifications":
        return (
          <Panel
            title="Notification Settings"
            description="Choose which types of reminders you want to enable."
          >
            <div style={{ display: "grid", gap: 18 }}>
              {[
                {
                  key: "budget",

                  title: "Budget Alerts",

                  description:
                    "Receive reminders when approaching budget limits.",
                },

                {
                  key: "recurring",

                  title: "Recurring Transactions",

                  description: "Keep track of recurring expenses and payments.",
                },

                {
                  key: "goals",

                  title: "Financial Goals",

                  description: "Stay informed about your savings goals.",
                },

                {
                  key: "email",

                  title: "Email Notifications",

                  description: "Enable email notification preferences.",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  style={{
                    display: "flex",

                    alignItems: "center",

                    justifyContent: "space-between",

                    gap: 16,

                    padding: 16,

                    border: `1px solid ${theme.border}`,

                    borderRadius: 12,

                    cursor: "pointer",
                  }}
                >
                  <span>
                    <strong
                      style={{
                        display: "block",

                        color: theme.text,

                        fontSize: 14,
                      }}
                    >
                      {item.title}
                    </strong>

                    <span
                      style={{
                        display: "block",

                        color: theme.secondary,

                        fontSize: 12,

                        marginTop: 5,

                        lineHeight: 1.5,
                      }}
                    >
                      {item.description}
                    </span>
                  </span>

                  <input
                    type="checkbox"
                    checked={Boolean(notifs[item.key])}
                    onChange={(event) =>
                      updateNotificationPreference(
                        item.key,

                        event.target.checked,
                      )
                    }
                    style={{
                      width: 18,

                      height: 18,

                      accentColor: theme.primary,

                      flexShrink: 0,
                    }}
                  />
                </label>
              ))}
            </div>
          </Panel>
        );

      case "Data":
        return (
          <div style={{ display: "grid", gap: 20 }}>
            <Panel
              title="Export Data"
              description="Download a copy of your transaction data for your records."
            >
              <div
                style={{
                  display: "flex",

                  gap: 12,

                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={exportCSV}
                  disabled={busy}
                  style={buttonStyle}
                >
                  <Download size={16} />
                  Export Transactions CSV
                </button>

                <button
                  type="button"
                  onClick={exportJSON}
                  disabled={busy}
                  style={buttonStyle}
                >
                  <Database size={16} />
                  Export JSON Backup
                </button>
              </div>
            </Panel>

            <Panel
              title="Import Transactions"
              description="Import transactions from a compatible CSV or JSON file. Existing transactions will be preserved."
            >
              <input
                ref={importInputRef}
                type="file"
                accept=".csv,.json,application/json,text/csv"
                onChange={handleImport}
                style={{ display: "none" }}
              />

              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                disabled={busy}
                style={{
                  ...buttonStyle,

                  opacity: busy ? 0.65 : 1,
                }}
              >
                <Upload size={16} />
                Import Transactions
              </button>
            </Panel>

            <Panel
              title="Clear Transactions"
              description="Delete your transaction records. This action may be irreversible."
            >
              <p
                style={{
                  color: theme.secondary,

                  fontSize: 13,

                  lineHeight: 1.7,

                  marginTop: 0,
                }}
              >
                This action deletes transactions associated with your account.
                Export a backup before proceeding.
              </p>

              <button
                type="button"
                onClick={clearTransactions}
                disabled={busy}
                style={{
                  ...buttonStyle,

                  background: clearConfirm ? "#b91c1c" : theme.danger,

                  opacity: busy ? 0.65 : 1,
                }}
              >
                <Trash2 size={16} />

                {clearConfirm
                  ? "Confirm Delete Transactions"
                  : "Clear Transactions"}
              </button>

              {clearConfirm && (
                <button
                  type="button"
                  onClick={() => setClearConfirm(false)}
                  disabled={busy}
                  style={{
                    ...buttonStyle,

                    background: theme.secondary,

                    marginLeft: 10,
                  }}
                >
                  Cancel
                </button>
              )}
            </Panel>
          </div>
        );

      case "About":
        return (
          <Panel
            title="About SplitMate"
            description="Your personal expense management application."
          >
            <div style={{ color: theme.text, lineHeight: 1.8 }}>
              <h2 style={{ marginTop: 0, fontSize: 24 }}>SplitMate</h2>

              <p style={{ color: theme.secondary, fontSize: 14 }}>
                SplitMate helps you manage transactions, track expenses,
                organize budgets, and monitor financial goals in one place.
              </p>

              <div
                style={{
                  display: "grid",

                  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",

                  gap: 12,

                  marginTop: 20,
                }}
              >
                {[
                  ["Application", "SplitMate"],

                  ["Version", "1.0.0"],

                  ["Category", "Expense Management"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    style={{
                      padding: 16,

                      border: `1px solid ${theme.border}`,

                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{
                        color: theme.secondary,

                        fontSize: 12,

                        marginBottom: 6,
                      }}
                    >
                      {label}
                    </div>

                    <strong style={{ fontSize: 14 }}>{value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </Panel>
        );

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",

        background: theme.bg,

        color: theme.text,

        transition: "background 0.2s ease, color 0.2s ease",
      }}
    >
      <Navbar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main
        style={{
          maxWidth: 1200,

          width: "100%",

          boxSizing: "border-box",

          margin: "0 auto",

          padding: "28px 20px 48px",
        }}
      >
        <header style={{ marginBottom: 26 }}>
          <h1
            style={{
              margin: 0,

              fontSize: 30,

              fontWeight: 800,

              letterSpacing: "-0.7px",

              color: theme.text,
            }}
          >
            Settings
          </h1>

          <p
            style={{
              color: theme.secondary,

              fontSize: 14,

              lineHeight: 1.7,

              margin: "8px 0 0",
            }}
          >
            Manage your profile, security, preferences, and data.
          </p>
        </header>

        {savedMessage && (
          <div
            role="status"
            style={{
              marginBottom: 20,

              padding: "13px 16px",

              background: isDarkMode ? "#123323" : "#dcfce7",

              color: isDarkMode ? "#86efac" : "#166534",

              borderRadius: 10,

              border: `1px solid ${isDarkMode ? "#166534" : "#bbf7d0"}`,

              fontSize: 13,

              fontWeight: 650,
            }}
          >
            {savedMessage}
          </div>
        )}

        <div
          className="settings-layout"
          style={{
            display: "grid",

            gridTemplateColumns: "minmax(200px, 250px) minmax(0, 1fr)",

            gap: 22,

            alignItems: "start",

            width: "100%",

            minWidth: 0,
          }}
        >
          <aside
            className="settings-sidebar"
            style={{
              ...cardStyle,

              padding: 10,

              width: "100%",

              minWidth: 0,
            }}
          >
            <nav
              aria-label="Settings sections"
              style={{
                display: "grid",

                gap: 5,
              }}
            >
              {sections.map((section) => {
                const Icon = section.icon;

                const selected = activeSection === section.name;

                return (
                  <button
                    key={section.name}
                    type="button"
                    onClick={() => setActiveSection(section.name)}
                    aria-current={selected ? "page" : undefined}
                    style={{
                      display: "flex",

                      alignItems: "center",

                      gap: 12,

                      width: "100%",

                      boxSizing: "border-box",

                      padding: "13px 14px",

                      border: "none",

                      borderRadius: 10,

                      background: selected
                        ? isDarkMode
                          ? "#1e3a5f"
                          : "#dbeafe"
                        : "transparent",

                      color: selected ? theme.primary : theme.text,

                      fontWeight: selected ? 750 : 550,

                      fontSize: 13,

                      textAlign: "left",

                      cursor: "pointer",
                    }}
                  >
                    <Icon size={17} />

                    {section.name}
                  </button>
                );
              })}
            </nav>
          </aside>

          <div
            className="settings-content"
            style={{ minWidth: 0, width: "100%" }}
          >
            {renderContent()}
          </div>
        </div>
      </main>

      <style>{`

        .settings-layout,
        .settings-content,
        .settings-sidebar {
          min-width: 0;
          max-width: 100%;
        }

        @media (max-width: 700px) {
          .settings-layout {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 16px !important;
          }

          .settings-sidebar {
            position: static;
          }

          .settings-content > * {
            min-width: 0;
            max-width: 100%;
          }
        }

        @media (max-width: 420px) {
          .settings-layout {
            gap: 12px !important;
          }

          .settings-content input,
          .settings-content select,
          .settings-content textarea {
            min-width: 0 !important;
            max-width: 100% !important;
          }

          .settings-content button {
            max-width: 100%;
          }
        }

      `}</style>
    </div>
  );
};

export default Settings;
