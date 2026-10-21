import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as usersService from "./users.service.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireRole("ADMIN"));

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(1),
  role: z.enum(["ADMIN", "FRONT_DESK"]),
});

const updateUserSchema = z.object({
  fullName: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "FRONT_DESK"]).optional(),
  isActive: z.boolean().optional(),
});

usersRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ users: await usersService.listUsers() });
  } catch (err) {
    next(err);
  }
});

usersRouter.post("/", async (req, res, next) => {
  try {
    const input = createUserSchema.parse(req.body);
    res.status(201).json({ user: await usersService.createUser(input) });
  } catch (err) {
    next(err);
  }
});

usersRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = updateUserSchema.parse(req.body);
    res.json({ user: await usersService.updateUser(req.params.id, input) });
  } catch (err) {
    next(err);
  }
});

usersRouter.delete("/:id", async (req, res, next) => {
  try {
    res.json({ user: await usersService.deactivateUser(req.params.id) });
  } catch (err) {
    next(err);
  }
});
