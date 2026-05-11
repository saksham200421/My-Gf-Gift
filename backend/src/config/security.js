const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];

function parseAllowedOrigins() {
  const envValue = process.env.FRONTEND_ORIGIN;
  if (!envValue) {
    return DEFAULT_ALLOWED_ORIGINS;
  }

  const parsed = envValue
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsed.length ? parsed : DEFAULT_ALLOWED_ORIGINS;
}

function buildCorsOptions() {
  const allowedOrigins = parseAllowedOrigins();

  return {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  };
}

module.exports = {
  buildCorsOptions,
};
