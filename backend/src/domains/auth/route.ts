import { Router } from "express";
import { requireAuth } from "../../middlewares/auth.middleware.js";
import { loginLimiter, registerLimiter } from "../../middlewares/rateLimit.middleware.js";
import { setAuthCookie, clearAuthCookie } from "../../utils/auth-cookie.js";
import { signToken } from "../../utils/jwt.js";
import { registerSchema, loginSchema } from "./schemas.js";
import { registerUser, loginUser, loginAsGuest } from "./service.js";

const router = Router();

router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    const user = await registerUser(input);
    const token = signToken(user.id);
    setAuthCookie(res, token);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body);
    const user = await loginUser(input);
    const token = signToken(user.id);
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/demo", loginLimiter, async (_req, res, next) => {
  try {
    const user = await loginAsGuest();
    const token = signToken(user.id);
    setAuthCookie(res, token);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  res.status(204).send();
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
