import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { AUTH_COOKIE_NAME, verifyToken } from "../utils/jwt.js";

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[AUTH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = verifyToken(token);
    const [user] = await db
      .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, payload.sub))
      .limit(1);

    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Not authenticated" });
  }
}
