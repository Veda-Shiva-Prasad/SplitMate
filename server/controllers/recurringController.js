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
    const { name, amount, category, frequency, nextDue, icon } = req.body || {};

    if (typeof name !== "string" || !name.trim() || name.trim().length > 100) {
      return res.status(400).json({
        message: "Enter a name up to 100 characters.",
      });
    }

    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
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

    if (!nextDue || Number.isNaN(new Date(nextDue).getTime())) {
      return res.status(400).json({
        message: "Select a valid next due date.",
      });
    }

    const row = await Recurring.create({
      userId: req.user._id,
      name: name.trim(),
      amount,
      category,
      frequency,
      nextDue: new Date(nextDue),
      icon: typeof icon === "string" ? icon.slice(0, 12) : undefined,
    });

    return res.status(201).json(row);
  } catch (error) {
    console.error("Create recurring error:", error);

    return res.status(400).json({
      message:
        "Unable to create this recurring payment. Check the details and try again.",
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

    const allowed = [
      "name",
      "amount",
      "category",
      "frequency",
      "nextDue",
      "icon",
    ];

    for (const key of allowed) {
      if (req.body?.[key] === undefined) {
        continue;
      }

      const value = req.body[key];

      if (key === "name") {
        if (
          typeof value !== "string" ||
          !value.trim() ||
          value.trim().length > 100
        ) {
          return res.status(400).json({
            message: "Enter a valid name.",
          });
        }

        row.name = value.trim();
      } else if (key === "amount") {
        if (
          typeof value !== "number" ||
          !Number.isFinite(value) ||
          value <= 0
        ) {
          return res.status(400).json({
            message: "Amount must be a positive number.",
          });
        }

        row.amount = value;
      } else if (key === "category") {
        if (!categories.includes(value)) {
          return res.status(400).json({
            message: "Select a valid category.",
          });
        }

        row.category = value;
      } else if (key === "frequency") {
        if (!frequencies.includes(value)) {
          return res.status(400).json({
            message: "Select a valid frequency.",
          });
        }

        row.frequency = value;
      } else if (key === "nextDue") {
        if (!value || Number.isNaN(new Date(value).getTime())) {
          return res.status(400).json({
            message: "Select a valid next due date.",
          });
        }

        row.nextDue = new Date(value);
      } else if (key === "icon") {
        if (typeof value !== "string") {
          return res.status(400).json({
            message: "Invalid icon.",
          });
        }

        row.icon = value.slice(0, 12);
      }
    }

    await row.save();

    return res.status(200).json(row);
  } catch (error) {
    console.error("Update recurring error:", error);

    return res.status(400).json({
      message: "Unable to update this recurring payment.",
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
      message: "Recurring payment deleted.",
    });
  } catch (error) {
    console.error("Delete recurring error:", error);

    return res.status(500).json({
      message: "Unable to delete this recurring payment.",
    });
  }
};
