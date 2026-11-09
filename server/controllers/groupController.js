const mongoose = require("mongoose");
const Group = require("../models/Group");
const { cleanString } = require("../utils/validate");

const serverError = (res, label, error) => {
  console.error(`${label} error:`, error);
  return res.status(500).json({ message: "Something went wrong. Please try again." });
};

// POST /api/groups
exports.createGroup = async (req, res) => {
  try {
    const { name, description, members } = req.body || {};

    const cleanName = cleanString(name, 80);

    if (!cleanName) {
      return res.status(400).json({ message: "Enter a group name (up to 80 characters)." });
    }

    const cleanDescription = cleanString(description, 100);

    if (
      members !== undefined &&
      (!Array.isArray(members) ||
        members.length > 50 ||
        !members.every((id) => mongoose.isValidObjectId(id)))
    ) {
      return res.status(400).json({ message: "Members must be a list of valid user IDs." });
    }

    // The creator is always a member and the admin. Remove duplicates.
    const memberIds = [
      ...new Set([...(members || []).map(String), req.user._id.toString()]),
    ];

    const group = await Group.create({
      name: cleanName,
      description: cleanDescription,
      members: memberIds,
      admin: req.user._id,
    });

    return res.status(201).json({ success: true, data: group });
  } catch (error) {
    return serverError(res, "Create group", error);
  }
};

// GET /api/groups
exports.getUserGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id }).populate(
      "members",
      "name",
    );

    return res.status(200).json({ success: true, data: groups });
  } catch (error) {
    return serverError(res, "Get groups", error);
  }
};
