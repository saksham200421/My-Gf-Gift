const Letter = require("../models/Letter");
const { resolveCoupleForUser } = require("../services/coupleService");

function mapLetter(letter) {
  return {
    id: letter._id.toString(),
    title: letter.title,
    date: letter.date,
    preview: letter.preview,
    content: letter.content,
    createdAt: letter.createdAt,
  };
}

async function listLetters(req, res) {
  const { couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: false });
  const letters = await Letter.find(couple ? { coupleId: couple._id } : { userId: req.auth.userId }).sort({
    createdAt: -1,
  });
  return res.json({ letters: letters.map(mapLetter) });
}

async function createLetter(req, res) {
  const { title, content, date, preview } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ message: "Title and content are required" });
  }

  const { couple } = await resolveCoupleForUser(req.auth.userId, { createIfMissing: false });

  const letter = await Letter.create({
    userId: req.auth.userId,
    ...(couple ? { coupleId: couple._id } : {}),
    title: title.trim(),
    content: content.trim(),
    date: date?.trim() || "Today",
    preview: preview?.trim() || content.trim().slice(0, 90),
  });

  return res.status(201).json({ letter: mapLetter(letter) });
}

module.exports = {
  listLetters,
  createLetter,
};
