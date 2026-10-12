const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 128,
      select: false,
    },

    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: "",
    },

    profilePhoto: {
      type: String,
      default: "",
      maxlength: 3000000,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);
