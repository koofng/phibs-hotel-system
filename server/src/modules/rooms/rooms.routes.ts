import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as roomsService from "./rooms.service.js";

export const roomsRouter = Router();

roomsRouter.use(requireAuth);

const housekeepingStatuses = ["CLEAN", "DIRTY", "INSPECTED", "OUT_OF_SERVICE"] as const;

const createRoomSchema = z.object({
  roomNumber: z.string().min(1),
  roomTypeId: z.string().uuid(),
  floor: z.number().int(),
});

const updateRoomSchema = createRoomSchema.partial().extend({
  isActive: z.boolean().optional(),
});

const housekeepingSchema = z.object({
  housekeepingStatus: z.enum(housekeepingStatuses),
});

roomsRouter.get("/", async (req, res, next) => {
  try {
    const housekeepingStatus = req.query.housekeepingStatus as
      | (typeof housekeepingStatuses)[number]
      | undefined;
    const roomTypeId = req.query.roomTypeId as string | undefined;
    res.json({ rooms: await roomsService.listRooms({ housekeepingStatus, roomTypeId }) });
  } catch (err) {
    next(err);
  }
});

roomsRouter.get("/availability", async (req, res, next) => {
  try {
    const checkIn = new Date(String(req.query.checkIn));
    const checkOut = new Date(String(req.query.checkOut));
    const roomTypeId = req.query.roomTypeId as string | undefined;
    res.json({ rooms: await roomsService.findAvailableRooms(checkIn, checkOut, roomTypeId) });
  } catch (err) {
    next(err);
  }
});

roomsRouter.post("/", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const input = createRoomSchema.parse(req.body);
    res.status(201).json({ room: await roomsService.createRoom(input) });
  } catch (err) {
    next(err);
  }
});

roomsRouter.patch("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    const input = updateRoomSchema.parse(req.body);
    res.json({ room: await roomsService.updateRoom(req.params.id, input) });
  } catch (err) {
    next(err);
  }
});

roomsRouter.patch("/:id/housekeeping-status", async (req, res, next) => {
  try {
    const { housekeepingStatus } = housekeepingSchema.parse(req.body);
    res.json({ room: await roomsService.updateHousekeepingStatus(req.params.id, housekeepingStatus) });
  } catch (err) {
    next(err);
  }
});
