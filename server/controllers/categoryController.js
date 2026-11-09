const Category = require("../models/Category");
const { cleanString, isPositiveNumber } = require("../utils/validate");

const serverError = (res, label, error) => {
  console.error(`${label} error:`, error);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
};

// GET /api/categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ userId: req.user._id });
    return res.status(200).json(categories);
  } catch (error) {
    return serverError(res, "Get categories", error);
  }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
  try {
    const { name, limit, color, icon } = req.body || {};

    const cleanName = cleanString(name, 50);

    if (!cleanName) {
      return res.status(400).json({ message: "Enter a category name (up to 50 characters)." });
    }

    if (limit !== undefined && limit !== null && !isPositiveNumber(limit)) {
      return res.status(400).json({ message: "Limit must be a positive number." });
    }

    if (color !== undefined && !/^#[0-9a-fA-F]{3,8}$/.test(color)) {
      return res.status(400).json({ message: "Select a valid color." });
    }

    const duplicate = await Category.findOne({
      userId: req.user._id,
      name: cleanName,
    }).lean();

    if (duplicate) {
      return res.status(409).json({ message: "You already have a category with that name." });
    }

    const category = await Category.create({
      userId: req.user._id,
      name: cleanName,
      limit: limit ?? null,
      color: color || undefined,
      icon: cleanString(icon, 12) || undefined,
    });

    return res.status(201).json(category);
  } catch (error) {
    return serverError(res, "Create category", error);
  }
};

// DELETE /api/categories/:name
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({
      userId: req.user._id,
      name: req.params.name,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    return res.status(200).json({ message: "Category deleted." });
  } catch (error) {
    return serverError(res, "Delete category", error);
  }
};
