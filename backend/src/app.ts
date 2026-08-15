import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import apiRoutes from "./domains/api.js";
import { envelopeMiddleware } from "./middlewares/envelope.middleware.js";
import { requireTrustedOrigin } from "./middlewares/csrf.middleware.js";
import { generalLimiter } from "./middlewares/rateLimit.middleware.js";
import { notFoundHandler, globalErrorHandler } from "./middlewares/error.middleware.js";
import { openapiDocument } from "./docs/openapi.js";

export function createApp({ corsOrigin }: { corsOrigin: string }) {
  const app = express();

  app.use(cors({ origin: corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.get("/api-docs.json", (_req, res) => res.json(openapiDocument));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

  app.use("/api", envelopeMiddleware, requireTrustedOrigin, generalLimiter, apiRoutes);

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  return app;
}
