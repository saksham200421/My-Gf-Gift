const { Server } = require("socket.io");

const { verifyAuthToken } = require("./utils/jwt");
const { resolveCoupleForUser } = require("./services/coupleService");
const { buildCorsOptions } = require("./config/security");

function serializePresenceMembers(setValue) {
  return Array.from(setValue || []);
}

function setupSocketServer(httpServer, app) {
  const io = new Server(httpServer, {
    cors: buildCorsOptions(),
  });

  const presenceStore = new Map();
  app.set("io", io);
  app.set("presenceStore", presenceStore);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token || typeof token !== "string") {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = verifyAuthToken(token.trim());
      socket.auth = payload;
      return next();
    } catch {
      return next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    try {
      const userId = socket.auth?.userId;
      if (!userId) {
        socket.disconnect(true);
        return;
      }

      const { couple } = await resolveCoupleForUser(userId, { createIfMissing: false });
      const roomId = couple ? `couple:${couple._id.toString()}` : `user:${userId}`;
      socket.join(roomId);

      const roomUsers = presenceStore.get(roomId) || new Set();
      roomUsers.add(userId.toString());
      presenceStore.set(roomId, roomUsers);
      io.to(roomId).emit("presence:update", {
        onlineUsers: serializePresenceMembers(roomUsers),
      });

      socket.on("disconnect", () => {
        const onlineNow = presenceStore.get(roomId);
        if (!onlineNow) {
          return;
        }
        onlineNow.delete(userId.toString());
        if (onlineNow.size === 0) {
          presenceStore.delete(roomId);
        } else {
          presenceStore.set(roomId, onlineNow);
        }
        io.to(roomId).emit("presence:update", {
          onlineUsers: serializePresenceMembers(onlineNow),
        });
      });
    } catch {
      socket.disconnect(true);
    }
  });

  return io;
}

module.exports = {
  setupSocketServer,
};
