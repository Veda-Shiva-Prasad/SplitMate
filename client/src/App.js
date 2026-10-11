import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { DataProvider } from "./context/DataContext";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Budget from "./pages/Budget";
import Categories from "./pages/Categories";
import Recurring from "./pages/Recurring";
import Goals from "./pages/Goals";
import Insights from "./pages/Insights";
import Reports from "./pages/Reports";
import Activity from "./pages/Activity";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";

import "./index.css";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem("splitmate_theme") !== "light";
    } catch {
      return true;
    }
  });

  const handleThemeToggle = (value) => {
    setIsDarkMode(value);

    try {
      localStorage.setItem("splitmate_theme", value ? "dark" : "light");
    } catch (error) {
      console.error("Unable to save theme preference:", error);
    }
  };

  const themeProps = {
    isDarkMode,
    setIsDarkMode: handleThemeToggle,
  };

  return (
    <DataProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <Budget {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/categories"
            element={
              <ProtectedRoute>
                <Categories {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/recurring"
            element={
              <ProtectedRoute>
                <Recurring {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <Goals {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <Insights {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <Reports {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/activity"
            element={
              <ProtectedRoute>
                <Activity {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications {...themeProps} />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </DataProvider>
  );
}

export default App;
