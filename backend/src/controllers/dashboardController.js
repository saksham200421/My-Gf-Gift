const CoupleDashboard = require("../models/CoupleDashboard");
const User = require("../models/User");
const { sendPingEmail } = require("../utils/email");

const allowedDashboardThemes = new Set([
  "soft-blush",
  "sweet-lilac",
  "dreamy-sky",
  "midnight-rose",
  "plum-night",
  "berry-mist",
  "moonlit-ocean",
  "dusky-lavender",
  "velvet-indigo",
  "cocoa-petal",
  "noir-romance",
]);

const allowedDashboardBackgroundThemes = new Set([
  "rose-glow",
  "lavender-night",
  "moon-blue",
  "plum-haze",
  "cocoa-dusk",
  "starlit-indigo",
]);

async function ensureDashboard(userId) {
  let dashboard = await CoupleDashboard.findOne({ userId });

  if (!dashboard) {
    dashboard = await CoupleDashboard.create({ userId });
  }

  return dashboard;
}

function mapDashboard(dashboard) {
  return {
    id: dashboard._id.toString(),
    eatToday: dashboard.eatToday,
    moodToday: dashboard.moodToday,
    songPick: dashboard.songPick,
    wannaGoTo: dashboard.wannaGoTo,
    highlightedDates: dashboard.highlightedDates,
    specialOccasions: Array.isArray(dashboard.specialOccasions) ? dashboard.specialOccasions : [],
    messageHistory: Array.isArray(dashboard.messageHistory)
      ? dashboard.messageHistory
          .slice()
          .sort((first, second) => first.createdAt - second.createdAt)
          .map((message) => ({
            text: message.text,
            createdAt: message.createdAt,
          }))
      : [],
    thoughtToday: dashboard.thoughtToday,
    madReason: dashboard.madReason,
    gratitudeNote: dashboard.gratitudeNote,
    datePlan: dashboard.datePlan,
    smallWin: dashboard.smallWin,
    dashboardTheme: dashboard.dashboardTheme,
    dashboardBackgroundTheme: dashboard.dashboardBackgroundTheme,
    todos: dashboard.todos
      .slice()
      .sort((first, second) => second.createdAt - first.createdAt)
      .map((todo) => ({
        id: todo._id.toString(),
        text: todo.text,
        done: todo.done,
        createdAt: todo.createdAt,
      })),
  };
}

async function getDashboard(req, res) {
  const dashboard = await ensureDashboard(req.auth.userId);
  return res.json({ dashboard: mapDashboard(dashboard) });
}

async function updateDashboard(req, res) {
  const dashboard = await ensureDashboard(req.auth.userId);

  const allowedFields = [
    "eatToday",
    "moodToday",
    "songPick",
    "wannaGoTo",
    "thoughtToday",
    "madReason",
    "gratitudeNote",
    "datePlan",
    "smallWin",
    "dashboardTheme",
    "dashboardBackgroundTheme",
  ];

  for (const fieldName of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, fieldName)) {
      const nextValue = String(req.body[fieldName] || "").trim();

      if (fieldName === "dashboardTheme") {
        if (allowedDashboardThemes.has(nextValue)) {
          dashboard.dashboardTheme = nextValue;
        }
        continue;
      }

      if (fieldName === "dashboardBackgroundTheme") {
        if (allowedDashboardBackgroundThemes.has(nextValue)) {
          dashboard.dashboardBackgroundTheme = nextValue;
        }
        continue;
      }

      dashboard[fieldName] = nextValue;
    }
  }

  await dashboard.save();
  return res.json({ dashboard: mapDashboard(dashboard) });
}

async function toggleHighlightedDate(req, res) {
  const { dateKey } = req.body || {};

  if (!dateKey || typeof dateKey !== "string") {
    return res.status(400).json({ message: "dateKey is required" });
  }

  const dashboard = await ensureDashboard(req.auth.userId);
  const normalizedKey = dateKey.trim();

  if (!normalizedKey) {
    return res.status(400).json({ message: "dateKey is required" });
  }

  const alreadyHighlighted = dashboard.highlightedDates.includes(normalizedKey);

  if (alreadyHighlighted) {
    dashboard.highlightedDates = dashboard.highlightedDates.filter((item) => item !== normalizedKey);
  } else {
    dashboard.highlightedDates.push(normalizedKey);
  }

  await dashboard.save();
  return res.json({ dashboard: mapDashboard(dashboard) });
}

async function addTodo(req, res) {
  const { text } = req.body || {};

  if (!text || !String(text).trim()) {
    return res.status(400).json({ message: "Todo text is required" });
  }

  const dashboard = await ensureDashboard(req.auth.userId);
  dashboard.todos.push({ text: String(text).trim(), done: false });
  await dashboard.save();

  return res.status(201).json({ dashboard: mapDashboard(dashboard) });
}

async function updateTodo(req, res) {
  const { todoId } = req.params;
  const { text, done } = req.body || {};

  const dashboard = await ensureDashboard(req.auth.userId);
  const todo = dashboard.todos.id(todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  if (Object.prototype.hasOwnProperty.call(req.body || {}, "text")) {
    const normalizedText = String(text || "").trim();
    if (!normalizedText) {
      return res.status(400).json({ message: "Todo text cannot be empty" });
    }
    todo.text = normalizedText;
  }

  if (typeof done === "boolean") {
    todo.done = done;
  }

  await dashboard.save();
  return res.json({ dashboard: mapDashboard(dashboard) });
}

async function deleteTodo(req, res) {
  const { todoId } = req.params;

  const dashboard = await ensureDashboard(req.auth.userId);
  const todo = dashboard.todos.id(todoId);

  if (!todo) {
    return res.status(404).json({ message: "Todo not found" });
  }

  todo.deleteOne();
  await dashboard.save();

  return res.json({ dashboard: mapDashboard(dashboard) });
}

async function upsertSpecialOccasion(req, res) {
  const { dateKey, text } = req.body || {};

  if (!dateKey || typeof dateKey !== "string") {
    return res.status(400).json({ message: "dateKey is required" });
  }

  const normalizedDateKey = String(dateKey).trim();
  const normalizedText = String(text || "").trim();

  if (!normalizedText) {
    return res.status(400).json({ message: "Occasion text is required" });
  }

  const dashboard = await ensureDashboard(req.auth.userId);
  const existingIndex = dashboard.specialOccasions.findIndex(
    (item) => item.dateKey === normalizedDateKey
  );

  if (existingIndex >= 0) {
    dashboard.specialOccasions[existingIndex].text = normalizedText;
  } else {
    dashboard.specialOccasions.push({
      dateKey: normalizedDateKey,
      text: normalizedText,
    });
  }

  await dashboard.save();
  return res.json({ dashboard: mapDashboard(dashboard) });
}

async function deleteSpecialOccasion(req, res) {
  const { dateKey } = req.params;
  const normalizedDateKey = String(dateKey || "").trim();

  if (!normalizedDateKey) {
    return res.status(400).json({ message: "dateKey is required" });
  }

  const dashboard = await ensureDashboard(req.auth.userId);
  const previousCount = dashboard.specialOccasions.length;
  dashboard.specialOccasions = dashboard.specialOccasions.filter(
    (item) => item.dateKey !== normalizedDateKey
  );

  if (dashboard.specialOccasions.length === previousCount) {
    return res.status(404).json({ message: "Occasion not found" });
  }

  await dashboard.save();
  return res.json({ dashboard: mapDashboard(dashboard) });
}

async function sendPing(req, res) {
  const fromUser = await User.findById(req.auth.userId).select("name email");
  if (!fromUser) {
    return res.status(404).json({ message: "User not found" });
  }

  const recipient = process.env.PING_NOTIFY_EMAIL || fromUser.email;

  setImmediate(async () => {
    try {
      await sendPingEmail({
        to: recipient,
        fromUserName: fromUser.name,
        fromUserEmail: fromUser.email,
      });
    } catch (error) {
      console.error("Ping email failed:", error.message);
    }
  });

  return res.status(202).json({ message: `${fromUser.name} pinged you` });
}

async function addChatMessage(req, res) {
  const text = String(req.body?.text || "").trim();

  if (!text) {
    return res.status(400).json({ message: "Message text is required" });
  }

  const dashboard = await ensureDashboard(req.auth.userId);
  dashboard.messageHistory.push({ text, createdAt: new Date() });

  if (dashboard.messageHistory.length > 300) {
    dashboard.messageHistory = dashboard.messageHistory.slice(-300);
  }

  await dashboard.save();
  return res.status(201).json({ dashboard: mapDashboard(dashboard) });
}

module.exports = {
  getDashboard,
  updateDashboard,
  toggleHighlightedDate,
  addTodo,
  updateTodo,
  deleteTodo,
  upsertSpecialOccasion,
  deleteSpecialOccasion,
  sendPing,
  addChatMessage,
};