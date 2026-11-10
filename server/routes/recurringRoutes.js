
const express = require("express");
const router = express.Router();

const {
  getRecurring,
  createRecurring,
  updateRecurring,
  deleteRecurring,
} = require("../controllers/recurringController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getRecurring);
router.post("/", createRecurring);
router.put("/:id", updateRecurring);
router.delete("/:id", deleteRecurring);

module.exports = router;
