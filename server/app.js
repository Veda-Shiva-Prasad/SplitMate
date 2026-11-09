const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const goalRoutes = require("./routes/goalRoutes");
const owedRoutes = require("./routes/owedRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const groupRoutes = require("./routes/groupRoutes");

const app = express();

// Trust the hosting platform's proxy when deployed (needed for rate limiting).
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());

// CORS configuration
const allowedOrigins = [
  "http://localhost:3000",
  "https://split-mate-chi.vercel.app",
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(",")
    .map((url) => url.trim().replace(/\/$/, ""))
    .filter(Boolean)
    .forEach((url) => allowedOrigins.push(url));
}

app.use(
  cors({
    origin(origin, callback) {
      // Requests without an Origin header (health checks, server-to-server).
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS."));
    },
    credentials: true,
  }),
);

// Base64-encoded profile photos are larger than the original image.
app.use(express.json({ limit: "6mb" }));
app.use(express.urlencoded({ extended: true, limit: "6mb" }));

// Slow down password guessing on login and registration.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: process.env.NODE_ENV === "test" ? 1000 : 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many attempts. Please try again in a few minutes." },
});

// Health check
app.get("/", (req, res) => {
  res.status(200).json({ message: "SplitMate API is running" });
});

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// API routes
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/owed", owedRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/groups", groupRoutes);

// Unknown API routes
app.use("/api", (req, res) => {
  return res.status(404).json({
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Application errors
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
    return res.status(400).json({ message: "Invalid JSON request." });
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

module.exports = app;
