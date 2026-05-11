const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const FALLBACK_SECRET = crypto.randomBytes(48).toString("hex");
let hasWarnedAboutFallback = false;

function getJwtSecret() {
  const configuredSecret = String(process.env.JWT_SECRET || "").trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET must be set in production");
  }

  if (!hasWarnedAboutFallback) {
    console.warn("JWT_SECRET is not set. Using insecure development fallback secret.");
    hasWarnedAboutFallback = true;
  }

  return FALLBACK_SECRET;
}

function getJwtConfig() {
  return {
    issuer: process.env.JWT_ISSUER || "my-gf-gift-api",
    audience: process.env.JWT_AUDIENCE || "my-gf-gift-client",
    algorithm: "HS256",
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  };
}

function signAuthToken(payload) {
  const jwtConfig = getJwtConfig();
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: jwtConfig.expiresIn,
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
    algorithm: jwtConfig.algorithm,
  });
}

function verifyAuthToken(token) {
  const jwtConfig = getJwtConfig();
  return jwt.verify(token, getJwtSecret(), {
    algorithms: [jwtConfig.algorithm],
    issuer: jwtConfig.issuer,
    audience: jwtConfig.audience,
  });
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
};
