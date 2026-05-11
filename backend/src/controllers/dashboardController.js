const CoupleDashboard = require("../models/CoupleDashboard");
const User = require("../models/User");
const { sendPingEmail } = require("../utils/email");
const { resolveCoupleForUser } = require("../services/coupleService");

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

const allowedPetActions = new Set(["feed", "play", "rest", "cuddle"]);

function clampMetric(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function ensureVirtualPet(dashboard) {
  if (!dashboard.virtualPet) {
    dashboard.virtualPet = {};
  }

  const pet = dashboard.virtualPet;
  pet.name = String(pet.name || "Mochi").trim().slice(0, 40) || "Mochi";
  pet.species = String(pet.species || "Love Cat").trim().slice(0, 40) || "Love Cat";
  pet.fullness = clampMetric(Number.isFinite(pet.fullness) ? pet.fullness : 70);
  pet.energy = clampMetric(Number.isFinite(pet.energy) ? pet.energy : 72);
  pet.happiness = clampMetric(Number.isFinite(pet.happiness) ? pet.happiness : 78);
  pet.level = Math.max(1, Math.floor(Number.isFinite(pet.level) ? pet.level : 1));
  pet.xp = Math.max(0, Math.floor(Number.isFinite(pet.xp) ? pet.xp : 0));
  pet.lastActionAt = pet.lastActionAt ? new Date(pet.lastActionAt) : new Date();

  return pet;
}

function computePetMood(pet) {
  if (pet.fullness <= 20) {
    return "hungry";
  }
  if (pet.energy <= 18) {
    return "sleepy";
  }
  if (pet.happiness <= 28) {
    return "sad";
  }
  if (pet.happiness >= 84 && pet.energy >= 55 && pet.fullness >= 45) {
    return "excited";
  }
  if (pet.energy >= 70 && pet.happiness >= 65) {
    return "happy";
  }
  return "calm";
}

function applyPassivePetDecay(dashboard) {
  const pet = ensureVirtualPet(dashboard);
  const now = new Date();
  const elapsedMs = Math.max(0, now.getTime() - new Date(pet.lastActionAt).getTime());
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  if (elapsedHours < 0.5) {
    pet.mood = computePetMood(pet);
    return false;
  }

  const nextFullness = pet.fullness - elapsedHours * 1.4;
  const nextEnergy = pet.energy - elapsedHours * 1.05;
  const nextHappiness = pet.happiness - elapsedHours * 0.7;

  pet.fullness = clampMetric(nextFullness);
  pet.energy = clampMetric(nextEnergy);
  pet.happiness = clampMetric(nextHappiness);
  pet.mood = computePetMood(pet);
  pet.lastActionAt = now;

  return true;
}

function applyPetAction(pet, action) {
  if (action === "feed") {
    pet.fullness = clampMetric(pet.fullness + 24);
    pet.energy = clampMetric(pet.energy + 4);
    pet.happiness = clampMetric(pet.happiness + 6);
    pet.xp += 9;
  }

  if (action === "play") {
    pet.fullness = clampMetric(pet.fullness - 12);
    pet.energy = clampMetric(pet.energy - 15);
    pet.happiness = clampMetric(pet.happiness + 18);
    pet.xp += 14;
  }

  if (action === "rest") {
    pet.fullness = clampMetric(pet.fullness - 5);
    pet.energy = clampMetric(pet.energy + 24);
    pet.happiness = clampMetric(pet.happiness + 4);
    pet.xp += 10;
  }

  if (action === "cuddle") {
    pet.fullness = clampMetric(pet.fullness - 4);
    pet.energy = clampMetric(pet.energy + 6);
    pet.happiness = clampMetric(pet.happiness + 14);
    pet.xp += 11;
  }

  while (pet.xp >= pet.level * 100) {
    pet.xp -= pet.level * 100;
    pet.level += 1;
    pet.happiness = clampMetric(pet.happiness + 8);
    pet.energy = clampMetric(pet.energy + 5);
  }

  pet.mood = computePetMood(pet);
}

async function ensureDashboard(userId) {
  const { couple } = await resolveCoupleForUser(userId, { createIfMissing: false });
  const query = couple ? { coupleId: couple._id } : { userId };
  let dashboard = await CoupleDashboard.findOne(query);

  if (!dashboard) {
    dashboard = await CoupleDashboard.create(query);
  }

  return dashboard;
}

function mapDashboard(dashboard) {
  const pet = ensureVirtualPet(dashboard);

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
            authorId: message.authorId ? message.authorId.toString() : null,
            authorName: message.authorName || "",
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
    virtualPet: {
      name: pet.name,
      species: pet.species,
      mood: pet.mood,
      fullness: pet.fullness,
      energy: pet.energy,
      happiness: pet.happiness,
      level: pet.level,
      xp: pet.xp,
      xpToNext: Math.max(1, pet.level * 100),
      lastActionAt: pet.lastActionAt,
    },
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
  const hasDecayChanges = applyPassivePetDecay(dashboard);
  if (hasDecayChanges) {
    await dashboard.save();
  }
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

  const { couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: false });
  let recipient = process.env.PING_NOTIFY_EMAIL || fromUser.email;
  if (couple?.members?.length >= 2) {
    const partnerId = couple.members.find((memberId) => memberId.toString() !== fromUser._id.toString());
    const partner = partnerId ? await User.findById(partnerId).select("email") : null;
    if (partner?.email) {
      recipient = partner.email;
    }
  }

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
  const author = await User.findById(req.auth.userId).select("name");
  const message = {
    authorId: req.auth.userId,
    authorName: author?.name || "Partner",
    text,
    createdAt: new Date(),
  };
  dashboard.messageHistory.push(message);

  if (dashboard.messageHistory.length > 300) {
    dashboard.messageHistory = dashboard.messageHistory.slice(-300);
  }

  await dashboard.save();
  const io = req.app.get("io");
  const roomId = dashboard.coupleId
    ? `couple:${dashboard.coupleId.toString()}`
    : `user:${req.auth.userId}`;
  if (io) {
    io.to(roomId).emit("chat:new-message", {
      authorId: message.authorId?.toString?.() || null,
      authorName: message.authorName,
      text: message.text,
      createdAt: message.createdAt,
    });
  }
  return res.status(201).json({ dashboard: mapDashboard(dashboard) });
}

async function updateVirtualPetName(req, res) {
  const rawName = String(req.body?.name || "").trim();
  if (!rawName) {
    return res.status(400).json({ message: "Pet name is required" });
  }

  const dashboard = await ensureDashboard(req.auth.userId);
  const pet = ensureVirtualPet(dashboard);
  pet.name = rawName.slice(0, 40);
  pet.lastActionAt = new Date();
  pet.mood = computePetMood(pet);

  await dashboard.save();
  return res.json({ dashboard: mapDashboard(dashboard) });
}

async function performVirtualPetAction(req, res) {
  const action = String(req.body?.action || "").trim().toLowerCase();
  if (!allowedPetActions.has(action)) {
    return res.status(400).json({ message: "Invalid pet action" });
  }

  const dashboard = await ensureDashboard(req.auth.userId);
  applyPassivePetDecay(dashboard);
  const pet = ensureVirtualPet(dashboard);
  applyPetAction(pet, action);
  pet.lastActionAt = new Date();

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
  upsertSpecialOccasion,
  deleteSpecialOccasion,
  sendPing,
  addChatMessage,
  updateVirtualPetName,
  performVirtualPetAction,
};
