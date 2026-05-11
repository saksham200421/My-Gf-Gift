const mongoose = require("mongoose");

const coupleMilestoneSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 500,
    },
    eventAt: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: "UTC",
      trim: true,
      maxlength: 80,
    },
  },
  {
    timestamps: true,
  }
);

const coupleReminderSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 220,
    },
    remindAt: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: "UTC",
      trim: true,
      maxlength: 80,
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

const coupleSchema = new mongoose.Schema(
  {
    members: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      ],
      default: [],
      validate: {
        validator(value) {
          return Array.isArray(value) && value.length >= 1 && value.length <= 2;
        },
        message: "A couple must have one or two members",
      },
    },
    status: {
      type: String,
      enum: ["solo", "paired"],
      default: "solo",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inviteCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
      maxlength: 32,
    },
    inviteRecipientEmail: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },
    inviteExpiresAt: {
      type: Date,
      default: null,
    },
    sharedTimezone: {
      type: String,
      default: "UTC",
      trim: true,
      maxlength: 80,
    },
    milestones: {
      type: [coupleMilestoneSchema],
      default: [],
    },
    reminders: {
      type: [coupleReminderSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

coupleSchema.index({ inviteCode: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Couple", coupleSchema);
