const jwt = require("jsonwebtoken");

function getJwtSecret() {
  return process.env.JWT_SECRET || "dev-super-secret-change-me";
}

function signAuthToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: "7d",
  });
}

function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signAuthToken,
  verifyAuthToken,
};
