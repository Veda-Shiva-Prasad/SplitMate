const express = require("express");
const router = express.Router();
const {
  addExpense,
  getUserTransactions,
  getSummary,
  deleteExpense,
  deleteAllExpenses,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // All routes require authentication

router.get("/", getUserTransactions);
router.post("/", addExpense);
router.delete("/", deleteAllExpenses);
router.delete("/:id", deleteExpense);
router.get("/summary", getSummary);

module.exports = router;
