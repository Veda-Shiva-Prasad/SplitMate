const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const MAX_PROFILE_PHOTO_BYTES = 4 * 1024 * 1024;

const publicUser = (user) => ({
  id: user._id.toString(),
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  phone: user.phone || "",
  profilePhoto: user.profilePhoto || "",
});

const createToken = (userId) => {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    const error = new Error("Server authentication configuration is invalid.");
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign({ id: userId.toString() }, secret, {
    expiresIn: "1d",
  });
};

const validEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const fail = (res, status, message) => res.status(status).json({ message });

// REGISTER
exports.register = async (req, res) => {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";

    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (name.length < 2 || name.length > 80) {
      return fail(res, 400, "Name must be between 2 and 80 characters.");
    }

    if (!validEmail(email) || email.length > 254) {
      return fail(res, 400, "Please enter a valid email address.");
    }

    if (password.length < 6 || password.length > 128) {
      return fail(res, 400, "Password must be between 6 and 128 characters.");
    }

    const existing = await User.findOne({ email }).select("_id").lean();

    if (existing) {
      return fail(
        res,
        409,
        "An account with this email already exists. Please log in.",
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    const token = createToken(user._id);

    return res.status(201).json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return fail(
        res,
        409,
        "An account with this email already exists. Please log in.",
      );
    }

    if (error.name === "ValidationError") {
      return fail(res, 400, "Please check the information you entered.");
    }

    console.error("Register error:", error);

    return fail(
      res,
      error.statusCode || 500,
      error.statusCode
        ? error.message
        : "Unable to create your account right now.",
    );
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.trim().toLowerCase()
        : "";

    const password =
      typeof req.body?.password === "string" ? req.body.password : "";

    if (!validEmail(email) || !password) {
      return fail(res, 400, "Enter a valid email and password.");
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return fail(res, 401, "Invalid email or password.");
    }

    const token = createToken(user._id);

    return res.status(200).json({
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return fail(
      res,
      error.statusCode || 500,
      error.statusCode ? error.message : "Unable to log in right now.",
    );
  }
};

// GET CURRENT USER
exports.getMe = async (req, res) => {
  try {
    if (!req.user) {
      return fail(res, 401, "Authentication required.");
    }

    return res.status(200).json({
      user: publicUser(req.user),
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return fail(res, 500, "Unable to load your profile right now.");
  }
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const updates = {};

    if (req.body?.name !== undefined) {
      if (
        typeof req.body.name !== "string" ||
        req.body.name.trim().length < 2 ||
        req.body.name.trim().length > 80
      ) {
        return fail(res, 400, "Name must be between 2 and 80 characters.");
      }

      updates.name = req.body.name.trim();
    }

    if (req.body?.email !== undefined) {
      const email =
        typeof req.body.email === "string"
          ? req.body.email.trim().toLowerCase()
          : "";

      if (!validEmail(email) || email.length > 254) {
        return fail(res, 400, "Please enter a valid email address.");
      }

      const duplicate = await User.findOne({
        email,
        _id: { $ne: req.user._id },
      })
        .select("_id")
        .lean();

      if (duplicate) {
        return fail(res, 409, "That email address is already in use.");
      }

      updates.email = email;
    }

    if (req.body?.phone !== undefined) {
      if (
        typeof req.body.phone !== "string" ||
        req.body.phone.trim().length > 30
      ) {
        return fail(res, 400, "Phone number must be 30 characters or fewer.");
      }

      updates.phone = req.body.phone.trim();
    }

    if (req.body?.profilePhoto !== undefined) {
      const photo = req.body.profilePhoto;

      if (
        typeof photo !== "string" ||
        (photo !== "" &&
          !/^data:image\/(png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(
            photo,
          ))
      ) {
        return fail(res, 400, "Please upload a valid image file.");
      }

      if (Buffer.byteLength(photo, "utf8") > MAX_PROFILE_PHOTO_BYTES) {
        return fail(
          res,
          413,
          "Profile image is too large. Choose an image smaller than 2 MB.",
        );
      }

      updates.profilePhoto = photo;
    }

    if (Object.keys(updates).length === 0) {
      return fail(res, 400, "No profile changes were provided.");
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      return fail(res, 404, "User not found.");
    }

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return fail(res, 409, "That email address is already in use.");
    }

    if (error.name === "ValidationError") {
      return fail(res, 400, "Please check the profile information.");
    }

    console.error("Profile update error:", error);

    return fail(res, 500, "Unable to update your profile right now.");
  }
};

// CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (
      typeof currentPassword !== "string" ||
      !currentPassword ||
      typeof newPassword !== "string"
    ) {
      return fail(res, 400, "Enter your current password and a new password.");
    }

    if (newPassword.length < 8 || newPassword.length > 128) {
      return fail(
        res,
        400,
        "New password must be between 8 and 128 characters.",
      );
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return fail(res, 400, "Your current password is incorrect.");
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      return fail(res, 400, "Choose a password you have not used before.");
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    console.error("Password change error:", error);

    return fail(res, 500, "Unable to change your password right now.");
  }
};
