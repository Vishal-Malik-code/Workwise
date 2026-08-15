import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const JWT_EXPIRES_IN = "7d";

export interface TokenPayload {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
}
