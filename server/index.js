require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const goalRoutes = require("./routes/goalRoutes");
const owedRoutes = require("./routes/owedRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const groupRoutes = require("./routes/groupRoutes");

const app = express();

// Trust the hosting platform's proxy when deployed.
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://split-mate-chi.vercel.app",
];

if (process.env.CLIENT_URL) {
  allowedOrigins.push(process.env.CLIENT_URL.replace(/\/$/, ""));
}

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header can include health checks
      // and server-to-server requests.
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  }),
);

// Parse JSON requests.
// Base64-encoded profile photos are larger than the original image.
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true, limit: "6mb" }));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "SplitMate API is running",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/owed", owedRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/groups", groupRoutes);

// Handle unknown API routes.
app.use("/api", (req, res) => {
  return res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Handle application errors.
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      message: "Request is too large. Please choose a smaller profile photo.",
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      message: "Invalid JSON request.",
    });
  }

  if (err.message === "Origin not allowed by CORS.") {
    return res.status(403).json({
      message: "This origin is not allowed to access the API.",
    });
  }

  console.error("Server error:", err);

  return res.status(err.status || 500).json({
    message: "An unexpected server error occurred.",
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database:", error.message);
    process.exit(1);
  });

module.exports = app;
