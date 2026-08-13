import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { createSocketServer } from "./sockets/index.js";

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const app = createApp({ corsOrigin: CORS_ORIGIN });
const httpServer = createServer(app);
const io = createSocketServer(httpServer, CORS_ORIGIN);

app.set("io", io);

httpServer.listen(PORT, () => {
  console.log(`Workwise API listening on http://localhost:${PORT}`);
});
