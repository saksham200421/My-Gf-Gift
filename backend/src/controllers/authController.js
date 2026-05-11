const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Letter = require("../models/Letter");
const { signAuthToken } = require("../utils/jwt");
const { isValidEmail, normalizeInput } = require("../utils/validation");

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function register(req, res) {
  const { name, email, password } = req.body || {};

  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !name.trim() ||
    !email.trim() ||
    !password.trim()
  ) {
    return res.status(400).json({ message: "Name, email, and password are required" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const normalizedName = normalizeInput(name, 120);
  const normalizedEmail = normalizeInput(email, 320).toLowerCase();

  if (!normalizedName) {
    return res.status(400).json({ message: "Name is required" });
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: "Enter a valid email address" });
  }

  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    return res.status(409).json({ message: "Email is already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: normalizedName,
    email: normalizedEmail,
    passwordHash,
  });

  await Letter.create({
    userId: user._id,
    title: "Welcome Letter",
    date: "First day",
    preview: "A small note saved just for you...",
    content:
      "Welcome to your private love-space. This letter was added automatically so you can start your collection right away.",
  });

  const token = signAuthToken({ userId: user._id.toString(), email: user.email });

  return res.status(201).json({
    token,
    user: sanitizeUser(user),
  });
}

async function login(req, res) {
  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password.trim()
  ) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  const normalizedUsername = normalizeInput(username, 120);
  const user = await User.findOne({
    name: {
      $regex: `^${escapeRegex(normalizedUsername)}$`,
      $options: "i",
    },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid username or password" });
  }

  const token = signAuthToken({ userId: user._id.toString(), email: user.email });

  return res.json({
    token,
    user: sanitizeUser(user),
  });
}

async function me(req, res) {
  const user = await User.findById(req.auth.userId).select("_id name email");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json({ user: sanitizeUser(user) });
}

module.exports = {
  register,
  login,
  me,
};
