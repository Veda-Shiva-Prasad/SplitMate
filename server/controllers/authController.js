const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const createToken = (userId) => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be configured with at least 32 characters.",
    );
  }

  return jwt.sign({ id: userId.toString() }, secret, {
    expiresIn: "1d",
  });
};

const handleAuthError = (res, error, operation) => {
  console.error(`${operation} error:`, error.message);

  if (error.code === 11000) {
    return res.status(409).json({
      message: "An account with this email already exists.",
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: Object.values(error.errors)
        .map((item) => item.message)
        .join(", "),
    });
  }

  return res.status(500).json({
    message: "An unexpected server error occurred.",
  });
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedName.length < 2 || normalizedName.length > 80) {
      return res.status(400).json({
        message: "Name must contain between 2 and 80 characters.",
      });
    }

    if (
      normalizedEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    if (password.length < 6 || password.length > 128) {
      return res.status(400).json({
        message: "Password must contain between 6 and 128 characters.",
      });
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error("JWT_SECRET is missing or too short.");
      return res.status(500).json({
        message: "Server authentication configuration error.",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = createToken(user._id);

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return handleAuthError(res, error, "Registration");
  }
};

// Login an existing user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Please provide your email and password.",
      });
    }

    if (password.length > 128) {
      return res.status(400).json({
        message: "Invalid credentials.",
      });
    }

    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      console.error("JWT_SECRET is missing or too short.");
      return res.status(500).json({
        message: "Server authentication configuration error.",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = createToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    return handleAuthError(res, error, "Login");
  }
};
