import { eq } from "drizzle-orm";
import { db, schema } from "../db/index.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signToken, AUTH_COOKIE_NAME, authCookieOptions } from "../utils/jwt.js";
import { registerSchema, loginSchema } from "../validators/auth.js";

export async function register(req, res, next) {
  try {
    const { name, email, password } = registerSchema.parse(req.body);

    const [existing] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing) {
      return res.status(409).json({ error: "Email is already registered" });
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(schema.users)
      .values({ name, email, passwordHash })
      .returning({ id: schema.users.id, name: schema.users.name, email: schema.users.email });

    const token = signToken(user.id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = signToken(user.id);
    res.cookie(AUTH_COOKIE_NAME, token, authCookieOptions);
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
}

export function logout(_req, res) {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
  res.status(204).send();
}

export function me(req, res) {
  res.json({ user: req.user });
}
