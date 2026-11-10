
const mongoose = require("mongoose");

const RecurringSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Bills",
        "Subscriptions",
        "Rent",
        "Insurance",
        "Loans",
        "Other",
      ],
    },

    frequency: {
      type: String,
      required: true,
      enum: [
        "Weekly",
        "Monthly",
        "Quarterly",
        "Yearly",
      ],
    },

    nextDue: {
      type: Date,
      required: true,
    },

    icon: {
      type: String,
      default: "🔄",
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model(
  "Recurring",
  RecurringSchema
);
