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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("CoupleDashboard", coupleDashboardSchema);