import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import * as publicService from "./public.service.js";

export const publicRouter = Router();

const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: "Too many booking attempts. Please try again later." } },
});

const createReservationSchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  roomId: z.string().uuid(),
  checkInDate: z.coerce.date(),
  checkOutDate: z.coerce.date(),
  numGuests: z.number().int().positive().default(1),
  preferredPaymentMethod: z.enum(["CASH", "CARD", "TRANSFER"]).optional(),
});

publicRouter.get("/room-types", async (_req, res, next) => {
  try {
    res.json({ roomTypes: await publicService.listRoomTypes() });
  } catch (err) {
    next(err);
  }
});

publicRouter.get("/rooms/availability", async (req, res, next) => {
  try {
    const checkIn = new Date(String(req.query.checkIn));
    const checkOut = new Date(String(req.query.checkOut));
    const roomTypeId = req.query.roomTypeId as string | undefined;
    res.json({ rooms: await publicService.searchAvailability(checkIn, checkOut, roomTypeId) });
  } catch (err) {
    next(err);
  }
});

publicRouter.post("/reservations", bookingLimiter, async (req, res, next) => {
  try {
    const input = createReservationSchema.parse(req.body);
    res.status(201).json({ reservation: await publicService.createPublicReservation(input) });
  } catch (err) {
    next(err);
  }
});

publicRouter.get("/reservations/:id", async (req, res, next) => {
  try {
    res.json({ reservation: await publicService.getPublicReservation(req.params.id) });
  } catch (err) {
    next(err);
  }
});
