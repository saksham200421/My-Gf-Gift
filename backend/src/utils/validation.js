const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeInput(value, maxLength) {
  return String(value || "")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(value) {
  return EMAIL_REGEX.test(String(value || "").trim().toLowerCase());
}

module.exports = {
  normalizeInput,
  isValidEmail,
};
