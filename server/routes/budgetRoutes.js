const express = require("express");
const router = express.Router();

const {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  getMonthlyLimit,
  updateMonthlyLimit,
} = require("../controllers/budgetController");

const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/limit", getMonthlyLimit);
router.put("/limit", updateMonthlyLimit);

router.get("/", getBudgets);
router.post("/", createOrUpdateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
