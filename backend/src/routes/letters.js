const express = require("express");

const { listLetters, createLetter } = require("../controllers/lettersController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireAuth, listLetters);
router.post("/", requireAuth, createLetter);

module.exports = router;
