const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || "100kb";
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 200);
const AUTH_RATE_LIMIT_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX || 10);

function sanitizeMongoOperators(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMongoOperators(item));
  }

  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  const sanitized = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (key.startsWith("$") || key.includes(".")) {
      continue;
    }
    sanitized[key] = sanitizeMongoOperators(nestedValue);
  }

  return sanitized;
}

function sanitizeRequestPayload(req, _res, next) {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeMongoOperators(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeMongoOperators(req.query);
  }

  next();
}

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  skip: (req) => req.method === "OPTIONS",
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many requests. Please try again later." },
});

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: AUTH_RATE_LIMIT_MAX,
  skip: (req) => req.method === "OPTIONS",
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many authentication attempts. Please try again later." },
});

function applySecurityMiddleware(app) {
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", "https:", "data:"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", "data:", "https:"],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'", "https:", "wss:", "ws:"],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(express.json({ limit: BODY_SIZE_LIMIT }));
  app.use(express.urlencoded({ extended: false, limit: BODY_SIZE_LIMIT }));
  app.use(sanitizeRequestPayload);
  app.use("/api", apiLimiter);
}

module.exports = {
  applySecurityMiddleware,
  authLimiter,
};
