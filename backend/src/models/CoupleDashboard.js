const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const specialOccasionSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 220,
    },
  },
  {
    _id: false,
  }
);

const messageHistoryItemSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    authorName: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const virtualPetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Mochi",
      trim: true,
      maxlength: 40,
    },
    species: {
      type: String,
      default: "Love Cat",
      trim: true,
      maxlength: 40,
    },
    mood: {
      type: String,
      default: "happy",
      trim: true,
      maxlength: 24,
    },
    fullness: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    energy: {
      type: Number,
      default: 72,
      min: 0,
      max: 100,
    },
    happiness: {
      type: Number,
      default: 78,
      min: 0,
      max: 100,
    },
    level: {
      type: Number,
      default: 1,
      min: 1,
    },
    xp: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastActionAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const coupleDashboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    coupleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Couple",
      default: null,
      unique: true,
      sparse: true,
      index: true,
    },
    eatToday: {
      type: String,
      default: "",
      trim: true,
      maxlength: 180,
    },
    moodToday: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    songPick: {
      type: String,
      default: "",
      trim: true,
      maxlength: 220,
    },
    wannaGoTo: {
      type: String,
      default: "",
      trim: true,
      maxlength: 220,
    },
    highlightedDates: {
      type: [String],
      default: [],
    },
    specialOccasions: {
      type: [specialOccasionSchema],
      default: [],
    },
    messageHistory: {
      type: [messageHistoryItemSchema],
      default: [],
    },
    virtualPet: {
      type: virtualPetSchema,
      default: () => ({}),
    },
    todos: {
      type: [todoSchema],
      default: [],
    },
    thoughtToday: {
      type: String,
      default: "",
      trim: true,
      maxlength: 600,
    },
    madReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 600,
    },
    gratitudeNote: {
      type: String,
      default: "",
      trim: true,
      maxlength: 600,
    },
    datePlan: {
      type: String,
      default: "",
      trim: true,
      maxlength: 600,
    },
    smallWin: {
      type: String,
      default: "",
      trim: true,
      maxlength: 600,
    },
    dashboardTheme: {
      type: String,
      default: "soft-blush",
      trim: true,
      maxlength: 80,
    },
    dashboardBackgroundTheme: {
      type: String,
      default: "rose-glow",
      trim: true,
      maxlength: 80,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CoupleDashboard", coupleDashboardSchema);
