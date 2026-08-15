import { eq } from "drizzle-orm";
import { db, schema } from "../../db/index.js";
import { hashPassword, verifyPassword } from "../../utils/password.js";
import { AppError } from "../../utils/AppError.js";
import type { RegisterInput, LoginInput } from "./schemas.js";

const GUEST_EMAIL = "guest.evaluator@workwise.app";

export async function registerUser(input: RegisterInput) {
  const { name, email, password } = input;

  const [existing] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (existing) {
    throw AppError.conflict("Email is already registered");
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(schema.users)
    .values({ name, email, passwordHash })
    .returning({ id: schema.users.id, name: schema.users.name, email: schema.users.email });

  return user;
}

export async function loginUser(input: LoginInput) {
  const { email, password } = input;

  const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw AppError.unauthorized("Invalid email or password");
  }

  return { id: user.id, name: user.name, email: user.email };
}

// Upserts a fixed guest account so evaluators can try the product without
// registering. Password is not user-known/usable for login; this endpoint
// is the only way in for this account.
export async function loginAsGuest() {
  const [existing] = await db
    .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.email, GUEST_EMAIL))
    .limit(1);

  if (existing) return existing;

  const passwordHash = await hashPassword(`guest-${Date.now()}-${Math.random()}`);
  const [user] = await db
    .insert(schema.users)
    .values({ name: "Guest Evaluator", email: GUEST_EMAIL, passwordHash })
    .returning({ id: schema.users.id, name: schema.users.name, email: schema.users.email });

  return user;
}
