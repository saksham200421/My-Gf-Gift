const http = require("http");

const app = require("./app");
const { connectDatabase } = require("./config/database");
const { setupSocketServer } = require("./socket");

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDatabase();

    const server = http.createServer(app);
    setupSocketServer(server, app);

    server.listen(PORT, () => {
      console.log(`API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
