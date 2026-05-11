const { createInviteForUser, getCoupleMembers, joinCoupleByInvite, resolveCoupleForUser } = require("../services/coupleService");

function normalizeTimezone(value) {
  return String(value || "UTC").trim().slice(0, 80) || "UTC";
}

function mapMilestone(item) {
  const eventAt = new Date(item.eventAt);
  const countdownMs = eventAt.getTime() - Date.now();
  return {
    id: item._id.toString(),
    title: item.title,
    note: item.note,
    eventAt,
    timezone: item.timezone || "UTC",
    countdownMs,
  };
}

function mapReminder(item) {
  const remindAt = new Date(item.remindAt);
  const countdownMs = remindAt.getTime() - Date.now();
  return {
    id: item._id.toString(),
    text: item.text,
    remindAt,
    timezone: item.timezone || "UTC",
    done: Boolean(item.done),
    countdownMs,
  };
}

async function getCoupleStatus(req, res) {
  const { user, couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: false });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  if (!couple) {
    return res.json({
      couple: null,
      relationship: { state: "solo" },
      members: [],
      presence: [],
    });
  }

  const members = await getCoupleMembers(couple);
  const presenceStore = req.app.get("presenceStore");
  const onlineUsers = presenceStore?.get(`couple:${couple._id.toString()}`) || new Set();

  return res.json({
    couple: {
      id: couple._id.toString(),
      status: couple.status,
      sharedTimezone: couple.sharedTimezone || "UTC",
      inviteCode: couple.inviteCode,
      inviteRecipientEmail: couple.inviteRecipientEmail,
      inviteExpiresAt: couple.inviteExpiresAt,
      milestones: (couple.milestones || []).map(mapMilestone),
      reminders: (couple.reminders || []).map(mapReminder),
    },
    relationship: {
      state: couple.members.length >= 2 ? "paired" : "waiting_partner",
    },
    members,
    presence: members.map((member) => ({
      userId: member.id,
      online: onlineUsers.has(member.id),
    })),
  });
}

async function createInvite(req, res) {
  const partnerEmail = String(req.body?.partnerEmail || "").trim().toLowerCase();
  if (!partnerEmail) {
    return res.status(400).json({ message: "partnerEmail is required" });
  }

  try {
    const couple = await createInviteForUser(req.auth.userId, partnerEmail);
    const members = await getCoupleMembers(couple);
    return res.status(201).json({
      couple: {
        id: couple._id.toString(),
        status: couple.status,
        sharedTimezone: couple.sharedTimezone || "UTC",
        inviteCode: couple.inviteCode,
        inviteRecipientEmail: couple.inviteRecipientEmail,
        inviteExpiresAt: couple.inviteExpiresAt,
      },
      members,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to create invite" });
  }
}

async function joinInvite(req, res) {
  const inviteCode = String(req.body?.inviteCode || "").trim();
  if (!inviteCode) {
    return res.status(400).json({ message: "inviteCode is required" });
  }

  try {
    const couple = await joinCoupleByInvite(req.auth.userId, inviteCode);
    const members = await getCoupleMembers(couple);
    return res.json({
      couple: {
        id: couple._id.toString(),
        status: couple.status,
        sharedTimezone: couple.sharedTimezone || "UTC",
      },
      members,
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Failed to join couple" });
  }
}

async function updateSharedTimezone(req, res) {
  const timezone = normalizeTimezone(req.body?.timezone);
  const { couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: true });
  couple.sharedTimezone = timezone;
  await couple.save();

  return res.json({
    couple: {
      id: couple._id.toString(),
      sharedTimezone: couple.sharedTimezone,
    },
  });
}

async function addMilestone(req, res) {
  const title = String(req.body?.title || "").trim();
  const note = String(req.body?.note || "").trim();
  const timezone = normalizeTimezone(req.body?.timezone);
  const eventAtInput = req.body?.eventAt;

  if (!title || !eventAtInput) {
    return res.status(400).json({ message: "title and eventAt are required" });
  }

  const eventAt = new Date(eventAtInput);
  if (Number.isNaN(eventAt.getTime())) {
    return res.status(400).json({ message: "Invalid eventAt date" });
  }

  const { couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: true });
  couple.milestones.push({ title, note, eventAt, timezone });
  await couple.save();

  return res.status(201).json({
    milestones: couple.milestones.map(mapMilestone),
  });
}

async function deleteMilestone(req, res) {
  const { milestoneId } = req.params;
  const { couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: true });
  const milestone = couple.milestones.id(milestoneId);
  if (!milestone) {
    return res.status(404).json({ message: "Milestone not found" });
  }
  milestone.deleteOne();
  await couple.save();
  return res.json({ milestones: couple.milestones.map(mapMilestone) });
}

async function addReminder(req, res) {
  const text = String(req.body?.text || "").trim();
  const timezone = normalizeTimezone(req.body?.timezone);
  const remindAtInput = req.body?.remindAt;

  if (!text || !remindAtInput) {
    return res.status(400).json({ message: "text and remindAt are required" });
  }

  const remindAt = new Date(remindAtInput);
  if (Number.isNaN(remindAt.getTime())) {
    return res.status(400).json({ message: "Invalid remindAt date" });
  }

  const { couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: true });
  couple.reminders.push({ text, remindAt, timezone, done: false });
  await couple.save();

  return res.status(201).json({
    reminders: couple.reminders.map(mapReminder),
  });
}

async function updateReminder(req, res) {
  const { reminderId } = req.params;
  const { done } = req.body || {};
  const { couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: true });
  const reminder = couple.reminders.id(reminderId);
  if (!reminder) {
    return res.status(404).json({ message: "Reminder not found" });
  }
  if (typeof done === "boolean") {
    reminder.done = done;
  }
  await couple.save();
  return res.json({ reminders: couple.reminders.map(mapReminder) });
}

async function deleteReminder(req, res) {
  const { reminderId } = req.params;
  const { couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: true });
  const reminder = couple.reminders.id(reminderId);
  if (!reminder) {
    return res.status(404).json({ message: "Reminder not found" });
  }
  reminder.deleteOne();
  await couple.save();
  return res.json({ reminders: couple.reminders.map(mapReminder) });
}

module.exports = {
  getCoupleStatus,
  createInvite,
  joinInvite,
  updateSharedTimezone,
  addMilestone,
  deleteMilestone,
  addReminder,
  updateReminder,
  deleteReminder,
};
