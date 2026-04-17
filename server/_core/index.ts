import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { Server as SocketIOServer } from "socket.io";
import { registerOAuthRoutes } from "./oauth";
import { registerChatRoutes } from "./chat";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Global Socket.IO instance for broadcasting
let globalIO: SocketIOServer | null = null;

export function getIO(): SocketIOServer | null {
  return globalIO;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
    pingInterval: 25000,
    pingTimeout: 60000,
  });
  
  globalIO = io;
  
  // Socket.IO connection handling
  io.on("connection", (socket: any) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);
    
    socket.on("disconnect", () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
  
  // 含 gzip 墨缩成
  
  // 配置 body parser，文件上传大小限制
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // 添加響应頭优化
  app.use((req, res, next) => {
    // 在開發模式下，Vite 依賴和資源不應被快取，否則瀏覽器會載入舊版本導致 React 多實例問題
    // 在生產模式下，靜態資源有內容 hash，可以長期快取
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
    // 不探测服务器
    res.setHeader('X-Powered-By', 'Band Management');
    // 安全不探测
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });
  
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Chat API with streaming and tool calling
  registerChatRoutes(app);
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      responseMeta() {
        return {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        };
      },
    })
  );
  
  // Use fixed port 3000 for Socket.IO compatibility
  // The gateway/proxy will handle port routing
  const port = 3000;

  // development mode uses Vite, production mode uses static files
  // Port is determined first so Vite can configure HMR with the correct port
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server, port);
  } else {
    serveStatic(app);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
