import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as roomTypesService from "./room-types.service.js";

export const roomTypesRouter = Router();

roomTypesRouter.use(requireAuth);

const roomTypeSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().positive(),
  maxOccupancy: z.number().int().positive(),
  amenities: z.array(z.string()).default([]),
});

roomTypesRouter.get("/", async (_req, res, next) => {
  try {
    res.json({ roomTypes: await roomTypesService.listRoomTypes() });
  } catch (err) {
    next(err);
  }
});

roomTypesRouter.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const input = roomTypeSchema.parse(req.body);
    res.status(201).json({ roomType: await roomTypesService.createRoomType(input) });
  } catch (err) {
    next(err);
  }
});

roomTypesRouter.patch("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const input = roomTypeSchema.partial().parse(req.body);
    res.json({ roomType: await roomTypesService.updateRoomType(req.params.id, input) });
  } catch (err) {
    next(err);
  }
});

roomTypesRouter.delete("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    await roomTypesService.deleteRoomType(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
