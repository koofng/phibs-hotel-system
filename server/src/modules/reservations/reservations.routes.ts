import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import * as reservationsService from "./reservations.service.js";

export const reservationsRouter = Router();

reservationsRouter.use(requireAuth);

const statuses = ["BOOKED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED", "NO_SHOW"] as const;

const createReservationSchema = z
  .object({
    guestId: z.string().uuid().optional(),
    // Lets staff book someone who isn't in the guest list yet.
    newGuest: z
      .object({
        fullName: z.string().trim().min(1),
        email: z.string().trim().email().optional(),
        phone: z.string().trim().min(1),
      })
      .optional(),
    roomId: z.string().uuid(),
    checkInDate: z.coerce.date(),
    checkOutDate: z.coerce.date(),
    numGuests: z.number().int().positive().default(1),
  })
  .refine((v) => !!v.guestId !== !!v.newGuest, {
    message: "Provide either guestId or newGuest",
  });

const updateReservationSchema = z.object({
  roomId: z.string().uuid().optional(),
  checkInDate: z.coerce.date().optional(),
  checkOutDate: z.coerce.date().optional(),
  numGuests: z.number().int().positive().optional(),
});

const checkInSchema = z.object({ roomId: z.string().uuid().optional() });

reservationsRouter.get("/", async (req, res, next) => {
  try {
    const { status, guestId, fromDate, toDate } = req.query;
    res.json({
      reservations: await reservationsService.listReservations({
        status: status as (typeof statuses)[number] | undefined,
        guestId: guestId as string | undefined,
        fromDate: fromDate ? new Date(String(fromDate)) : undefined,
        toDate: toDate ? new Date(String(toDate)) : undefined,
      }),
    });
  } catch (err) {
    next(err);
  }
});

reservationsRouter.get("/:id", async (req, res, next) => {
  try {
    res.json({ reservation: await reservationsService.getReservation(req.params.id) });
  } catch (err) {
    next(err);
  }
});

reservationsRouter.post("/", async (req, res, next) => {
  try {
    const input = createReservationSchema.parse(req.body);
    res.status(201).json({
      reservation: await reservationsService.createReservation({
        ...input,
        createdById: req.user!.userId,
      }),
    });
  } catch (err) {
    next(err);
  }
});

reservationsRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = updateReservationSchema.parse(req.body);
    res.json({ reservation: await reservationsService.updateReservation(req.params.id, input) });
  } catch (err) {
    next(err);
  }
});

reservationsRouter.delete("/:id", requireRole("ADMIN"), async (req, res, next) => {
  try {
    await reservationsService.deleteReservation(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

reservationsRouter.post("/:id/cancel", async (req, res, next) => {
  try {
    res.json({ reservation: await reservationsService.cancelReservation(req.params.id) });
  } catch (err) {
    next(err);
  }
});

reservationsRouter.post("/:id/check-in", async (req, res, next) => {
  try {
    const { roomId } = checkInSchema.parse(req.body ?? {});
    res.json({ reservation: await reservationsService.checkIn(req.params.id, roomId) });
  } catch (err) {
    next(err);
  }
});

reservationsRouter.post("/:id/check-out", async (req, res, next) => {
  try {
    res.json({ reservation: await reservationsService.checkOut(req.params.id) });
  } catch (err) {
    next(err);
  }
});
