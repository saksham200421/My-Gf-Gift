const express = require("express");

const {
  getDashboard,
  updateDashboard,
  toggleHighlightedDate,
  addTodo,
  updateTodo,
  deleteTodo,
} = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, getDashboard);
router.patch("/", requireAuth, updateDashboard);
router.patch("/highlighted-dates", requireAuth, toggleHighlightedDate);
router.post("/todos", requireAuth, addTodo);
router.patch("/todos/:todoId", requireAuth, updateTodo);
router.delete("/todos/:todoId", requireAuth, deleteTodo);

module.exports = router;