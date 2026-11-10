
const mongoose = require("mongoose");
const Recurring = require("../models/Recurring");

const categories = [
  "Bills",
  "Subscriptions",
  "Rent",
  "Insurance",
  "Loans",
  "Other",
];

const frequencies = ["Weekly", "Monthly", "Quarterly", "Yearly"];

const validId = (id) => mongoose.isValidObjectId(id);

// GET /api/recurring
exports.getRecurring = async (req, res) => {
  try {
    const rows = await Recurring.find({
      userId: req.user._id,
    })
      .sort({ nextDue: 1 })
      .lean();

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Get recurring error:", error);

    return res.status(500).json({
      message: "Unable to load recurring payments.",
    });
  }
};

// POST /api/recurring
exports.createRecurring = async (req, res) => {
  try {
    const {
      name,
      amount,
      category,
      frequency,
      nextDue,
      icon,
    } = req.body || {};

    const numericAmount = Number(amount);

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100
    ) {
      return res.status(400).json({
        message: "Enter a valid payment name.",
      });
    }

    if (
      amount === "" ||
      amount === undefined ||
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        message: "Amount must be a positive number.",
      });
    }

    if (!categories.includes(category)) {
      return res.status(400).json({
        message: "Select a valid category.",
      });
    }

    if (!frequencies.includes(frequency)) {
      return res.status(400).json({
        message: "Select a valid frequency.",
      });
    }

    const parsedDate = new Date(nextDue);

    if (
      !nextDue ||
      Number.isNaN(parsedDate.getTime())
    ) {
      return res.status(400).json({
        message: "Select a valid next due date.",
      });
    }

    const row = await Recurring.create({
      userId: req.user._id,
      name: name.trim(),
      amount: numericAmount,
      category,
      frequency,
      nextDue: parsedDate,
      icon:
        typeof icon === "string"
          ? icon.slice(0, 12)
          : undefined,
    });

    return res.status(201).json(row);
  } catch (error) {
    console.error("Create recurring error:", error);

    return res.status(500).json({
      message: "Unable to create recurring payment.",
    });
  }
};

// PUT /api/recurring/:id
exports.updateRecurring = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid recurring payment ID.",
      });
    }

    const row = await Recurring.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!row) {
      return res.status(404).json({
        message: "Recurring payment not found.",
      });
    }

    const {
      name,
      amount,
      category,
      frequency,
      nextDue,
      icon,
    } = req.body || {};

    if (name !== undefined) {
      if (
        typeof name !== "string" ||
        !name.trim() ||
        name.trim().length > 100
      ) {
        return res.status(400).json({
          message: "Enter a valid payment name.",
        });
      }

      row.name = name.trim();
    }

    if (amount !== undefined) {
      const numericAmount = Number(amount);

      if (
        amount === "" ||
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {
        return res.status(400).json({
          message: "Amount must be a positive number.",
        });
      }

      row.amount = numericAmount;
    }

    if (category !== undefined) {
      if (!categories.includes(category)) {
        return res.status(400).json({
          message: "Select a valid category.",
        });
      }

      row.category = category;
    }

    if (frequency !== undefined) {
      if (!frequencies.includes(frequency)) {
        return res.status(400).json({
          message: "Select a valid frequency.",
        });
      }

      row.frequency = frequency;
    }

    if (nextDue !== undefined) {
      const parsedDate = new Date(nextDue);

      if (
        !nextDue ||
        Number.isNaN(parsedDate.getTime())
      ) {
        return res.status(400).json({
          message: "Select a valid next due date.",
        });
      }

      row.nextDue = parsedDate;
    }

    if (icon !== undefined) {
      if (typeof icon !== "string") {
        return res.status(400).json({
          message: "Invalid payment icon.",
        });
      }

      row.icon = icon.slice(0, 12);
    }

    await row.save();

    return res.status(200).json(row);
  } catch (error) {
    console.error("Update recurring error:", error);

    return res.status(500).json({
      message: "Unable to update recurring payment.",
    });
  }
};

// DELETE /api/recurring/:id
exports.deleteRecurring = async (req, res) => {
  try {
    if (!validId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid recurring payment ID.",
      });
    }

    const row = await Recurring.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!row) {
      return res.status(404).json({
        message: "Recurring payment not found.",
      });
    }

    return res.status(200).json({
      message: "Recurring payment deleted successfully.",
    });
  } catch (error) {
    console.error("Delete recurring error:", error);

    return res.status(500).json({
      message: "Unable to delete recurring payment.",
    });
  }
};
