require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health");

const app = express();

const allowedOrigins = process.env.FRONTEND_ORIGIN
	? process.env.FRONTEND_ORIGIN.split(",")
			.map((origin) => origin.trim())
			.filter(Boolean)
	: null;

app.use(
	cors({
		origin: (origin, callback) => {
			if (!allowedOrigins) {
				return callback(null, true);
			}
			if (!origin || allowedOrigins.includes(origin)) {
				return callback(null, true);
			}
			return callback(new Error("Not allowed by CORS"));
		},
	})
);
app.use(express.json());

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.get("/valentine", (req, res) => {
	res.sendFile(path.join(publicDir, "valentine.html"));
});

app.use("/api", healthRouter);

module.exports = app;
