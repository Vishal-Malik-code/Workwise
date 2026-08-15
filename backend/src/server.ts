import { env } from "./config/env.js";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { createSocketServer } from "./socket.js";

const app = createApp({ corsOrigin: env.CORS_ORIGIN });
const httpServer = createServer(app);
createSocketServer(httpServer, env.CORS_ORIGIN);

httpServer.listen(env.PORT, () => {
  console.log(`Workwise API listening on http://localhost:${env.PORT}`);
});
