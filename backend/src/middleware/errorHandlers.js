function notFoundHandler(req, res) {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "Route not found" });
  }
  return res.status(404).send("Not found");
}

function errorHandler(error, req, res, _next) {
  if (error?.message === "Not allowed by CORS") {
    return res.status(403).json({ message: "Origin not allowed" });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({ message: "Validation failed" });
  }

  if (error?.name === "CastError") {
    return res.status(400).json({ message: "Invalid identifier" });
  }

  const statusCode = Number.isInteger(error?.statusCode) ? error.statusCode : 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message =
    statusCode === 500 && isProduction
      ? "Internal server error"
      : error?.message || "Internal server error";

  console.error("Unhandled error:", error?.message || error);
  return res.status(statusCode).json({ message });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
