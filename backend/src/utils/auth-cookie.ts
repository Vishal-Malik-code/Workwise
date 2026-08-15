import type { Response, CookieOptions } from "express";
import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "workwise_token";

function cookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE_NAME, token, cookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
}
