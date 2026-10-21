import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import * as guestsService from "./guests.service.js";

export const guestsRouter = Router();

guestsRouter.use(requireAuth);

const guestSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  idDocumentNumber: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
});

guestsRouter.get("/", async (req, res, next) => {
  try {
    const search = req.query.search as string | undefined;
    res.json({ guests: await guestsService.listGuests(search) });
  } catch (err) {
    next(err);
  }
});

guestsRouter.get("/:id", async (req, res, next) => {
  try {
    res.json({ guest: await guestsService.getGuest(req.params.id) });
  } catch (err) {
    next(err);
  }
});

guestsRouter.post("/", async (req, res, next) => {
  try {
    const input = guestSchema.parse(req.body);
    res.status(201).json({ guest: await guestsService.createGuest(input) });
  } catch (err) {
    next(err);
  }
});

guestsRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = guestSchema.partial().parse(req.body);
    res.json({ guest: await guestsService.updateGuest(req.params.id, input) });
  } catch (err) {
    next(err);
  }
});
