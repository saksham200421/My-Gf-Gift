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

const coupleDashboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
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