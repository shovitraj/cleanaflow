import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "@cleanaglow/db";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer(httpServer, {
    path: "/api/socket/io",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    // Join conversation room
    socket.on("join_conversation", (conversationId: string) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation: ${conversationId}`);
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(conversationId);
    });

    // Send and persist real-time message
    socket.on("send_message", async (data: { conversationId: string; senderId: string; body: string }) => {
      const { conversationId, senderId, body } = data;
      if (!conversationId || !senderId || !body?.trim()) return;

      try {
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId,
            body: body.trim()
          },
          include: {
            sender: {
              select: { id: true, name: true, role: true }
            }
          }
        });

        // Broadcast to all participants in this conversation room
        io.to(conversationId).emit("message_received", message);
      } catch (err) {
        console.error("Failed to persist and emit socket message:", err);
      }
    });

    // Mark messages as read
    socket.on("read_receipt", async (data: { conversationId: string; userId: string }) => {
      try {
        await prisma.message.updateMany({
          where: {
            conversationId: data.conversationId,
            senderId: { not: data.userId },
            readAt: null
          },
          data: { readAt: new Date() }
        });
        io.to(data.conversationId).emit("messages_read", { conversationId: data.conversationId });
      } catch (err) {
        console.error("Failed to mark messages as read:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
