const Goal = require("../models/Goal");
const {
  isValidId,
  cleanString,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
} = require("../utils/validate");

const PRIORITIES = ["High", "Medium", "Low"];

const serverError = (res, label, error) => {
  console.error(`${label} error:`, error);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
};

// GET /api/goals
exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    return res.status(200).json(goals);
  } catch (error) {
    return serverError(res, "Get goals", error);
  }
};

// POST /api/goals
exports.createGoal = async (req, res) => {
  try {
    const { name, target, saved, deadline, priority, icon } = req.body || {};

    const cleanName = cleanString(name, 100);

    if (!cleanName) {
      return res.status(400).json({ message: "Enter a goal name (up to 100 characters)." });
    }

    if (!isPositiveNumber(target)) {
      return res.status(400).json({ message: "Target must be a positive number." });
    }

    if (saved !== undefined && !isNonNegativeNumber(saved)) {
      return res.status(400).json({ message: "Saved amount cannot be negative." });
    }

    if (!isValidDate(deadline)) {
      return res.status(400).json({ message: "Select a valid deadline." });
    }

    if (priority !== undefined && !PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: "Select a valid priority." });
    }

    const goal = await Goal.create({
      userId: req.user._id,
      name: cleanName,
      target,
      saved: Math.min(saved || 0, target),
      deadline: new Date(deadline),
      priority: priority || "Medium",
      icon: cleanString(icon, 12) || undefined,
    });

    return res.status(201).json(goal);
  } catch (error) {
    return serverError(res, "Create goal", error);
  }
};

// PUT /api/goals/:id
exports.updateGoal = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid goal ID." });
    }

    const { saved, archived } = req.body || {};

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    if (saved !== undefined) {
      if (!isNonNegativeNumber(saved)) {
        return res.status(400).json({ message: "Saved amount cannot be negative." });
      }
      goal.saved = Math.min(saved, goal.target);
    }

    if (archived !== undefined) {
      if (typeof archived !== "boolean") {
        return res.status(400).json({ message: "Archived must be true or false." });
      }
      goal.archived = archived;
    }

    await goal.save();
    return res.status(200).json(goal);
  } catch (error) {
    return serverError(res, "Update goal", error);
  }
};

// DELETE /api/goals/:id
exports.deleteGoal = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid goal ID." });
    }

    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    return res.status(200).json({ message: "Goal deleted." });
  } catch (error) {
    return serverError(res, "Delete goal", error);
  }
};

// POST /api/goals/:id/add
exports.addToGoal = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid goal ID." });
    }

    const { amount } = req.body || {};

    if (!isPositiveNumber(amount)) {
      return res.status(400).json({ message: "Amount must be a positive number." });
    }

    const goal = await Goal.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!goal) {
      return res.status(404).json({ message: "Goal not found." });
    }

    goal.saved = Math.min(goal.saved + amount, goal.target);
    await goal.save();

    return res.status(200).json(goal);
  } catch (error) {
    return serverError(res, "Add to goal", error);
  }
};
