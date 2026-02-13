const { verifyAuthToken } = require("../utils/jwt");

function extractToken(req, options = {}) {
  const { allowQuery = false } = options;
  const authHeader = req.headers.authorization || "";

  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7).trim();
  }

  if (allowQuery && typeof req.query.token === "string") {
    return req.query.token.trim();
  }

  return null;
}

function requireAuth(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = verifyAuthToken(token);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireAuthForHtml(req, res, next) {
  const token = extractToken(req, { allowQuery: true });

  if (!token) {
    return res.status(401).send("Authentication required");
  }

  try {
    const payload = verifyAuthToken(token);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).send("Invalid or expired token");
  }
}

module.exports = {
  requireAuth,
  requireAuthForHtml,
};
