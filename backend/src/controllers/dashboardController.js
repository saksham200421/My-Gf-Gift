const CoupleDashboard = require("../models/CoupleDashboard");

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
    thoughtToday: dashboard.thoughtToday,
    madReason: dashboard.madReason,
    gratitudeNote: dashboard.gratitudeNote,
    datePlan: dashboard.datePlan,
    smallWin: dashboard.smallWin,
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
  ];

  for (const fieldName of allowedFields) {
    if (Object.prototype.hasOwnProperty.call(req.body || {}, fieldName)) {
      dashboard[fieldName] = String(req.body[fieldName] || "").trim();
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

module.exports = {
  getDashboard,
  updateDashboard,
  toggleHighlightedDate,
  addTodo,
  updateTodo,
  deleteTodo,
};