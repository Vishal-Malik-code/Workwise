import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Not found" } });
}

interface PgError extends Error {
  code?: string;
  constraint?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function globalErrorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: "BAD_REQUEST", message: "Validation failed", fields: err.flatten() },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, fields: err.fields },
    });
    return;
  }

  const pgErr = err as PgError;
  if (pgErr?.code === "23505") {
    res.status(409).json({
      error: { code: "CONFLICT", message: "A record with these values already exists" },
    });
    return;
  }

  if ((err as { type?: string })?.type === "entity.too.large") {
    res.status(413).json({ error: { code: "PAYLOAD_TOO_LARGE", message: "Payload too large" } });
    return;
  }

  console.error(err);
  const message = err instanceof Error ? err.message : "Internal server error";
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message } });
}
