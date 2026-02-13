const express = require("express");

const { latestSongs, searchSongs } = require("../controllers/musicController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/latest", requireAuth, latestSongs);
router.get("/search", requireAuth, searchSongs);

module.exports = router;
