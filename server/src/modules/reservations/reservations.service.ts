import type { PaymentMethod, ReservationSource, ReservationStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/ApiError.js";
import * as guestsService from "../guests/guests.service.js";

const ACTIVE_STATUSES: ReservationStatus[] = ["BOOKED", "CHECKED_IN"];

function nightsBetween(checkIn: Date, checkOut: Date): number {
  const ms = checkOut.getTime() - checkIn.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

async function assertRoomAvailable(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  excludeReservationId?: string,
) {
  const conflict = await prisma.reservation.findFirst({
    where: {
      roomId,
      status: { in: ACTIVE_STATUSES },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      checkInDate: { lt: checkOut },
      checkOutDate: { gt: checkIn },
    },
  });
  if (conflict) {
    throw ApiError.conflict("Room is not available for the selected dates");
  }
}

const include = {
  guest: true,
  room: { include: { roomType: true } },
  folio: true,
} as const;

export function listReservations(filters: {
  status?: ReservationStatus;
  guestId?: string;
  fromDate?: Date;
  toDate?: Date;
}) {
  return prisma.reservation.findMany({
    where: {
      status: filters.status,
      guestId: filters.guestId,
      checkInDate: filters.toDate ? { lte: filters.toDate } : undefined,
      checkOutDate: filters.fromDate ? { gte: filters.fromDate } : undefined,
    },
    include,
    orderBy: { checkInDate: "asc" },
  });
}

export async function getReservation(id: string) {
  const reservation = await prisma.reservation.findUnique({ where: { id }, include });
  if (!reservation) {
    throw ApiError.notFound("Reservation not found");
  }
  return reservation;
}

export async function createReservation(input: {
  guestId?: string;
  newGuest?: { fullName: string; email?: string; phone: string };
  roomId: string;
  checkInDate: Date;
  checkOutDate: Date;
  numGuests: number;
  createdById?: string;
  source?: ReservationSource;
  preferredPaymentMethod?: PaymentMethod;
}) {
  if (input.checkInDate >= input.checkOutDate) {
    throw ApiError.badRequest("checkOutDate must be after checkInDate");
  }

  const room = await prisma.room.findUnique({ where: { id: input.roomId }, include: { roomType: true } });
  if (!room || !room.isActive) {
    throw ApiError.badRequest("Room not found or inactive");
  }

  await assertRoomAvailable(input.roomId, input.checkInDate, input.checkOutDate);

  const nights = nightsBetween(input.checkInDate, input.checkOutDate);
  const ratePerNight = room.roomType.basePrice;

  // Resolve the guest only after the booking checks pass, so a failed booking
  // doesn't leave behind a stray guest record.
  let guestId = input.guestId;
  if (!guestId && input.newGuest) {
    const guest = input.newGuest.email
      ? await guestsService.findOrCreateByEmail({ ...input.newGuest, email: input.newGuest.email })
      : await guestsService.createGuest(input.newGuest);
    guestId = guest.id;
  }
  if (!guestId) {
    throw ApiError.badRequest("A guest is required");
  }

  return prisma.reservation.create({
    data: {
      guestId,
      roomId: input.roomId,
      checkInDate: input.checkInDate,
      checkOutDate: input.checkOutDate,
      numGuests: input.numGuests,
      ratePerNight,
      createdById: input.createdById,
      source: input.source ?? "STAFF",
      preferredPaymentMethod: input.preferredPaymentMethod,
      folio: {
        create: {
          status: "OPEN",
          lineItems: {
            create: {
              type: "ROOM_CHARGE",
              description: `Room charge (${nights} night${nights === 1 ? "" : "s"})`,
              amount: ratePerNight,
              quantity: nights,
            },
          },
        },
      },
    },
    include,
  });
}

export async function updateReservation(
  id: string,
  input: Partial<{ roomId: string; checkInDate: Date; checkOutDate: Date; numGuests: number }>,
) {
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Reservation not found");
  }
  if (!ACTIVE_STATUSES.includes(existing.status)) {
    throw ApiError.conflict("Only booked or checked-in reservations can be modified");
  }

  const roomId = input.roomId ?? existing.roomId;
  const checkInDate = input.checkInDate ?? existing.checkInDate;
  const checkOutDate = input.checkOutDate ?? existing.checkOutDate;

  if (checkInDate >= checkOutDate) {
    throw ApiError.badRequest("checkOutDate must be after checkInDate");
  }
  if (roomId) {
    await assertRoomAvailable(roomId, checkInDate, checkOutDate, id);
  }

  return prisma.reservation.update({
    where: { id },
    data: { roomId, checkInDate, checkOutDate, numGuests: input.numGuests },
    include,
  });
}

export async function cancelReservation(id: string) {
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Reservation not found");
  }
  if (!ACTIVE_STATUSES.includes(existing.status)) {
    throw ApiError.conflict("Only booked or checked-in reservations can be cancelled");
  }
  return prisma.reservation.update({ where: { id }, data: { status: "CANCELLED" }, include });
}

export async function checkIn(id: string, roomId?: string) {
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Reservation not found");
  }
  if (existing.status !== "BOOKED") {
    throw ApiError.conflict("Only booked reservations can be checked in");
  }

  const finalRoomId = roomId ?? existing.roomId;
  if (!finalRoomId) {
    throw ApiError.badRequest("A room must be assigned before check-in");
  }
  if (finalRoomId !== existing.roomId) {
    await assertRoomAvailable(finalRoomId, existing.checkInDate, existing.checkOutDate, id);
  }

  return prisma.reservation.update({
    where: { id },
    data: { status: "CHECKED_IN", roomId: finalRoomId },
    include,
  });
}

export async function checkOut(id: string) {
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Reservation not found");
  }
  if (existing.status !== "CHECKED_IN") {
    throw ApiError.conflict("Only checked-in reservations can be checked out");
  }

  await prisma.$transaction([
    prisma.reservation.update({ where: { id }, data: { status: "CHECKED_OUT" } }),
    ...(existing.roomId
      ? [prisma.room.update({ where: { id: existing.roomId }, data: { housekeepingStatus: "DIRTY" } })]
      : []),
  ]);

  return getReservation(id);
}
