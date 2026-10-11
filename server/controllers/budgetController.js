const mongoose = require("mongoose");
const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

const getMonthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;

  return { start, end, month };
};

const isValidAmount = (value, allowZero = false) =>
  typeof value === "number" &&
  Number.isFinite(value) &&
  (allowZero ? value >= 0 : value > 0);

const handleError = (res, error, operation) => {
  console.error(`${operation} error:`, error);

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: "Invalid budget data." });
  }

  return res.status(500).json({
    message: "An unexpected server error occurred.",
  });
};

// GET /api/budgets
exports.getBudgets = async (req, res) => {
  try {
    const { start, end, month } = getMonthRange();

    const [budgets, spending] = await Promise.all([
      Budget.find({
        userId: req.user._id,
        month,
        category: { $ne: "Monthly" },
      }).lean(),

      Expense.aggregate([
        {
          $match: {
            paidBy: new mongoose.Types.ObjectId(req.user._id.toString()),
            type: "expense",
            date: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: "$category",
            spent: { $sum: "$amount" },
          },
        },
      ]),
    ]);

    const spentByCategory = new Map(
      spending.map((item) => [item._id || "Other", item.spent]),
    );

    const result = budgets.map((budget) => ({
      ...budget,
      spent: spentByCategory.get(budget.category) || 0,
    }));

    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error, "Get budgets");
  }
};

// POST /api/budgets
exports.createOrUpdateBudget = async (req, res) => {
  try {
    const { category, limit } = req.body || {};

    const allowedCategories = [
      "Food",
      "Transport",
      "Bills",
      "Entertainment",
      "Health",
      "Shopping",
      "Other",
    ];

    if (
      typeof category !== "string" ||
      !allowedCategories.includes(category.trim())
    ) {
      return res.status(400).json({
        message: "Please select a valid budget category.",
      });
    }

    if (!isValidAmount(limit)) {
      return res.status(400).json({
        message: "Budget limit must be a positive number.",
      });
    }

    const { month } = getMonthRange();

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        category: category.trim(),
        month,
      },
      {
        $set: { limit },
        $setOnInsert: {
          userId: req.user._id,
          category: category.trim(),
          month,
          spent: 0,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json(budget);
  } catch (error) {
    return handleError(res, error, "Create or update budget");
  }
};

// DELETE /api/budgets/:id
exports.deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid budget ID." });
    }

    const budget = await Budget.findOneAndDelete({
      _id: id,
      userId: req.user._id,
      category: { $ne: "Monthly" },
    });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found." });
    }

    return res.status(200).json({
      message: "Budget deleted successfully.",
    });
  } catch (error) {
    return handleError(res, error, "Delete budget");
  }
};

// GET /api/budgets/limit
exports.getMonthlyLimit = async (req, res) => {
  try {
    const { month } = getMonthRange();

    let budget = await Budget.findOne({
      userId: req.user._id,
      category: "Monthly",
      month,
    });

    if (!budget) {
      budget = await Budget.create({
        userId: req.user._id,
        category: "Monthly",
        limit: 20000,
        spent: 0,
        month,
      });
    }

    return res.status(200).json({ limit: budget.limit });
  } catch (error) {
    return handleError(res, error, "Get monthly limit");
  }
};

// PUT /api/budgets/limit
exports.updateMonthlyLimit = async (req, res) => {
  try {
    const { limit } = req.body || {};

    if (!isValidAmount(limit)) {
      return res.status(400).json({
        message: "Monthly budget limit must be a positive number.",
      });
    }

    const { month } = getMonthRange();

    const budget = await Budget.findOneAndUpdate(
      {
        userId: req.user._id,
        category: "Monthly",
        month,
      },
      {
        $set: { limit },
        $setOnInsert: {
          userId: req.user._id,
          category: "Monthly",
          month,
          spent: 0,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );

    return res.status(200).json({
      limit: budget.limit,
      message: "Monthly budget updated successfully.",
    });
  } catch (error) {
    return handleError(res, error, "Update monthly limit");
  }
};
