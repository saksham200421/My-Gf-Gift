const express = require("express");

const {
  addMilestone,
  addReminder,
  createInvite,
  deleteMilestone,
  deleteReminder,
  getCoupleStatus,
  joinInvite,
  updateReminder,
  updateSharedTimezone,
} = require("../controllers/coupleController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, getCoupleStatus);
router.post("/invite", requireAuth, createInvite);
router.post("/join", requireAuth, joinInvite);
router.patch("/timezone", requireAuth, updateSharedTimezone);

router.post("/milestones", requireAuth, addMilestone);
router.delete("/milestones/:milestoneId", requireAuth, deleteMilestone);

router.post("/reminders", requireAuth, addReminder);
router.patch("/reminders/:reminderId", requireAuth, updateReminder);
router.delete("/reminders/:reminderId", requireAuth, deleteReminder);

module.exports = router;
