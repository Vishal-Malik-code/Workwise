import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import type { Request } from "express";

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

export const inviteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

export const pulsePerUserLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => req.user?.id ?? ipKeyGenerator(req.ip ?? "anonymous"),
});

export const pulsePerIpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
