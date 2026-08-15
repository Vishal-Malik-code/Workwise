import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { AUTH_COOKIE_NAME } from "../utils/auth-cookie.js";
import { verifyToken } from "../utils/jwt.js";
import { AppError } from "../utils/AppError.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      throw AppError.unauthorized();
    }

    const payload = verifyToken(token);
    const [user] = await db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, payload.sub))
      .limit(1);

    if (!user) {
      throw AppError.unauthorized();
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof AppError) return next(err);
    next(AppError.unauthorized());
  }
}
