const crypto = require("crypto");

const Couple = require("../models/Couple");
const User = require("../models/User");
const CoupleDashboard = require("../models/CoupleDashboard");
const Letter = require("../models/Letter");

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateInviteCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

async function findUserById(userId) {
  return User.findById(userId).select("_id name email coupleId timezone");
}

async function migrateUserScopedDataToCouple(userId, coupleId) {
  if (!userId || !coupleId) {
    return;
  }

  const dashboard = await CoupleDashboard.findOne({
    $and: [
      { userId },
      { $or: [{ coupleId: { $exists: false } }, { coupleId: null }] },
    ],
  });

  if (dashboard) {
    dashboard.coupleId = coupleId;
    await dashboard.save();
  }

  await Letter.updateMany(
    {
      $and: [
        { userId },
        { $or: [{ coupleId: { $exists: false } }, { coupleId: null }] },
      ],
    },
    { $set: { coupleId } }
  );
}

async function resolveCoupleForUser(userId, { createIfMissing = false } = {}) {
  const user = await findUserById(userId);
  if (!user) {
    return { user: null, couple: null };
  }

  if (user.coupleId) {
    const couple = await Couple.findById(user.coupleId);
    if (couple) {
      return { user, couple };
    }
    user.coupleId = undefined;
    await user.save();
  }

  if (!createIfMissing) {
    return { user, couple: null };
  }

  const couple = await Couple.create({
    members: [user._id],
    status: "solo",
    createdBy: user._id,
    sharedTimezone: user.timezone || "UTC",
  });

  user.coupleId = couple._id;
  await user.save();
  await migrateUserScopedDataToCouple(user._id, couple._id);

  return { user, couple };
}

async function createInviteForUser(userId, partnerEmail) {
  const { user, couple } = await resolveCoupleForUser(userId, { createIfMissing: true });
  if (!user || !couple) {
    throw new Error("User not found");
  }

  if (couple.members.length >= 2) {
    throw new Error("You already have a partner in your couple");
  }

  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    // eslint-disable-next-line no-await-in-loop
    const existing = await Couple.findOne({ inviteCode });
    if (!existing || existing._id.toString() === couple._id.toString()) {
      break;
    }
    inviteCode = generateInviteCode();
  }

  couple.inviteCode = inviteCode;
  couple.inviteRecipientEmail = String(partnerEmail || "")
    .trim()
    .toLowerCase() || null;
  couple.inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
  await couple.save();

  return couple;
}

async function joinCoupleByInvite(userId, inviteCodeInput) {
  const inviteCode = String(inviteCodeInput || "").trim().toUpperCase();
  if (!inviteCode) {
    throw new Error("Invite code is required");
  }

  const joiningUser = await findUserById(userId);
  if (!joiningUser) {
    throw new Error("User not found");
  }

  const targetCouple = await Couple.findOne({ inviteCode });
  if (!targetCouple) {
    throw new Error("Invalid invite code");
  }

  if (targetCouple.inviteExpiresAt && new Date(targetCouple.inviteExpiresAt).getTime() < Date.now()) {
    throw new Error("Invite code expired");
  }

  if (targetCouple.members.length >= 2) {
    throw new Error("This couple invite is already used");
  }

  if (targetCouple.members.some((memberId) => memberId.toString() === joiningUser._id.toString())) {
    return targetCouple;
  }

  const existingCoupleId = joiningUser.coupleId?.toString();
  if (existingCoupleId && existingCoupleId !== targetCouple._id.toString()) {
    const existingCouple = await Couple.findById(existingCoupleId);
    if (existingCouple && existingCouple.members.length >= 2) {
      throw new Error("You are already paired with a partner");
    }
  }

  targetCouple.members.push(joiningUser._id);
  targetCouple.status = "paired";
  targetCouple.inviteCode = null;
  targetCouple.inviteRecipientEmail = null;
  targetCouple.inviteExpiresAt = null;
  await targetCouple.save();

  joiningUser.coupleId = targetCouple._id;
  await joiningUser.save();

  await migrateUserScopedDataToCouple(joiningUser._id, targetCouple._id);

  return targetCouple;
}

async function getCoupleMembers(couple) {
  if (!couple) {
    return [];
  }
  const users = await User.find({ _id: { $in: couple.members } }).select("_id name email timezone");
  return users.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    timezone: user.timezone || "UTC",
  }));
}

module.exports = {
  resolveCoupleForUser,
  createInviteForUser,
  joinCoupleByInvite,
  getCoupleMembers,
  migrateUserScopedDataToCouple,
};
