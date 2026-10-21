import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env.js";
import { AUTH_COOKIE_NAME, requireAuth } from "../../middleware/auth.js";
import * as authService from "./auth.service.js";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const { token, user } = await authService.login(email, password);

    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: env.cookieSecure,
      maxAge: 8 * 60 * 60 * 1000,
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.status(204).send();
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user!.userId);
    res.json({ user });
  } catch (err) {
    next(err);
  }
});
