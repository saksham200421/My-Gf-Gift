const express = require("express");

const {
  getDashboard,
  updateDashboard,
  toggleHighlightedDate,
  upsertSpecialOccasion,
  deleteSpecialOccasion,
  addTodo,
  updateTodo,
  deleteTodo,
  sendPing,
  addChatMessage,
  updateVirtualPetName,
  performVirtualPetAction,
} = require("../controllers/dashboardController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, getDashboard);
router.patch("/", requireAuth, updateDashboard);
router.patch("/highlighted-dates", requireAuth, toggleHighlightedDate);
router.post("/special-occasion", requireAuth, upsertSpecialOccasion);
router.delete("/special-occasion/:dateKey", requireAuth, deleteSpecialOccasion);
router.post("/ping", requireAuth, sendPing);
router.post("/chat-messages", requireAuth, addChatMessage);
router.patch("/virtual-pet", requireAuth, updateVirtualPetName);
router.post("/virtual-pet/action", requireAuth, performVirtualPetAction);
router.post("/todos", requireAuth, addTodo);
router.patch("/todos/:todoId", requireAuth, updateTodo);
router.delete("/todos/:todoId", requireAuth, deleteTodo);

module.exports = router;