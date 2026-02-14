const express = require("express");

const {
	latestSongs,
	resolveYouTubeLink,
	searchSongs,
} = require("../controllers/musicController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/latest", requireAuth, latestSongs);
router.get("/search", requireAuth, searchSongs);
router.get("/resolve-youtube", requireAuth, resolveYouTubeLink);

module.exports = router;
