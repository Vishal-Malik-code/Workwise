import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function hostOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

export function requireTrustedOrigin(req: Request, _res: Response, next: NextFunction): void {
  if (!UNSAFE_METHODS.has(req.method)) {
    return next();
  }

  const origin = req.headers.origin as string | undefined;
  const referer = req.headers.referer as string | undefined;
  const candidate = origin ?? referer;

  if (!candidate) {
    if (env.NODE_ENV !== "production") {
      return next();
    }
    return next(AppError.forbidden("Missing Origin/Referer header"));
  }

  const candidateHost = hostOf(candidate);
  const trustedHost = hostOf(env.FRONTEND_URL);

  if (!candidateHost || candidateHost !== trustedHost) {
    return next(AppError.forbidden("Untrusted origin"));
  }

  next();
}
