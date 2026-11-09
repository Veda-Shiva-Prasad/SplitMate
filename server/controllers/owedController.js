const Owed = require("../models/Owed");
const { isValidId, cleanString, isPositiveNumber } = require("../utils/validate");

const serverError = (res, label, error) => {
  console.error(`${label} error:`, error);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
};

// GET /api/owed
exports.getOwed = async (req, res) => {
  try {
    const owed = await Owed.find({ userId: req.user._id }).sort({
      date: -1,
    });
    return res.status(200).json(owed);
  } catch (error) {
    return serverError(res, "Get owed", error);
  }
};

// POST /api/owed
exports.createOwed = async (req, res) => {
  try {
    const { name, amount, description } = req.body || {};

    const cleanName = cleanString(name, 80);

    if (!cleanName) {
      return res.status(400).json({ message: "Enter who owes you (up to 80 characters)." });
    }

    if (!isPositiveNumber(amount)) {
      return res.status(400).json({ message: "Amount must be a positive number." });
    }

    const owed = await Owed.create({
      userId: req.user._id,
      name: cleanName,
      amount,
      description: cleanString(description, 200) || "Shared expense",
    });

    return res.status(201).json(owed);
  } catch (error) {
    return serverError(res, "Create owed", error);
  }
};

// PUT /api/owed/:id/settle
exports.settleOwed = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid entry ID." });
    }

    const owed = await Owed.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { settled: true } },
      { new: true },
    );

    if (!owed) {
      return res.status(404).json({ message: "Entry not found." });
    }

    return res.status(200).json(owed);
  } catch (error) {
    return serverError(res, "Settle owed", error);
  }
};

// DELETE /api/owed/:id
exports.deleteOwed = async (req, res) => {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: "Invalid entry ID." });
    }

    const owed = await Owed.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!owed) {
      return res.status(404).json({ message: "Entry not found." });
    }

    return res.status(200).json({ message: "Entry deleted." });
  } catch (error) {
    return serverError(res, "Delete owed", error);
  }
};
