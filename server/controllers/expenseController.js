const mongoose = require("mongoose");
const Expense = require("../models/Expense");

// Format a transaction for the frontend.
const formatTransaction = (tx) => ({
  id: tx._id.toString(),
  name: tx.description,
  category: tx.category || "Other",
  amount: -Math.abs(Number(tx.amount) || 0),
  date: tx.date
    ? new Date(tx.date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      })
    : "",
  // Preserve the complete date for month/week filtering.
  rawDate: tx.date ? new Date(tx.date).toISOString() : null,
  icon: tx.icon || "📦",
});

// @desc Add a new personal expense
// @route POST /api/expenses
exports.addExpense = async (req, res) => {
  try {
    const { description, amount, category, date, icon } = req.body || {};

    if (
      typeof description !== "string" ||
      !description.trim() ||
      description.trim().length > 200
    ) {
      return res.status(400).json({
        message: "Please provide a valid expense description.",
      });
    }

    const numericAmount = Number(amount);

    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message: "Amount must be a positive number.",
      });
    }

    const expenseDate = date ? new Date(date) : new Date();

    if (Number.isNaN(expenseDate.getTime())) {
      return res.status(400).json({
        message: "Please provide a valid expense date.",
      });
    }

    const expense = await Expense.create({
      description: description.trim(),
      amount: numericAmount,
      type: "expense",
      paidBy: req.user._id,
      category:
        typeof category === "string" && category.trim()
          ? category.trim()
          : "Other",
      date: expenseDate,
      icon: typeof icon === "string" && icon.trim() ? icon : "📦",
    });

    return res.status(201).json(formatTransaction(expense));
  } catch (error) {
    console.error("Add expense error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Invalid expense data.",
      });
    }

    return res.status(500).json({
      message: "Could not add the expense.",
    });
  }
};

// @desc Get all personal expenses for the logged-in user
// @route GET /api/expenses
exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Expense.find({
      paidBy: req.user._id,
      type: "expense",
    }).sort({ date: -1 });

    return res.status(200).json(transactions.map(formatTransaction));
  } catch (error) {
    console.error("Get expenses error:", error.message);

    return res.status(500).json({
      message: "Could not load expenses.",
    });
  }
};

// @desc Delete an expense owned by the logged-in user
// @route DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid expense ID.",
      });
    }

    const expense = await Expense.findOneAndDelete({
      _id: id,
      paidBy: req.user._id,
      type: "expense",
    });

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      message: "Expense deleted successfully.",
    });
  } catch (error) {
    console.error("Delete expense error:", error.message);

    return res.status(500).json({
      message: "Could not delete the expense.",
    });
  }
};

// @desc Get all-time expense summary
// @route GET /api/expenses/summary
exports.getSummary = async (req, res) => {
  try {
    const result = await Expense.aggregate([
      {
        $match: {
          paidBy: new mongoose.Types.ObjectId(req.user._id),
          type: "expense",
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    return res.status(200).json({
      totalExpense: result[0]?.totalExpense || 0,
      transactionCount: result[0]?.transactionCount || 0,
    });
  } catch (error) {
    console.error("Expense summary error:", error.message);

    return res.status(500).json({
      message: "Could not load the expense summary.",
    });
  }
};
