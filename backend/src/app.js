require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");

const healthRouter = require("./routes/health");
const authRouter = require("./routes/auth");
const lettersRouter = require("./routes/letters");
const dashboardRouter = require("./routes/dashboard");
const exploreRouter = require("./routes/explore");
const musicRouter = require("./routes/music");
const coupleRouter = require("./routes/couple");
const { requireAuthForHtml } = require("./middleware/auth");
const { applySecurityMiddleware } = require("./middleware/security");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandlers");
const { buildCorsOptions } = require("./config/security");

const app = express();

applySecurityMiddleware(app);
app.use(cors(buildCorsOptions()));

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));

app.get("/valentine", requireAuthForHtml, (req, res) => {
	res.sendFile(path.join(publicDir, "valentine.html"));
});

app.use("/api", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/letters", lettersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/explore", exploreRouter);
app.use("/api/music", musicRouter);
app.use("/api/couple", coupleRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
