const mongoose = require("mongoose");

const isValidId = (id) => mongoose.isValidObjectId(id);

const cleanString = (value, max) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
};

const isPositiveNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

const isNonNegativeNumber = (value) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;

const isValidDate = (value) =>
  value !== undefined &&
  value !== null &&
  value !== "" &&
  !Number.isNaN(new Date(value).getTime());

module.exports = {
  isValidId,
  cleanString,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidDate,
};
