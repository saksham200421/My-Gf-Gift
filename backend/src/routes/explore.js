const express = require("express");

const { searchPlace } = require("../controllers/exploreController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/place", requireAuth, searchPlace);

module.exports = router;
