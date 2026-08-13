import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import projectRoutes from "./routes/project.routes.js";
import pulseRoutes from "./routes/pulse.routes.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp({ corsOrigin }) {
  const app = express();

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/workspaces", workspaceRoutes);
  app.use("/api/workspaces/:workspaceId/projects", projectRoutes);
  app.use("/api/workspaces/:workspaceId/pulse", pulseRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
