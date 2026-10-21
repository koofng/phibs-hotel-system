import type { HousekeepingStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/ApiError.js";

export function listRooms(filters: { housekeepingStatus?: HousekeepingStatus; roomTypeId?: string }) {
  return prisma.room.findMany({
    where: {
      housekeepingStatus: filters.housekeepingStatus,
      roomTypeId: filters.roomTypeId,
    },
    include: { roomType: true },
    orderBy: { roomNumber: "asc" },
  });
}

export async function findAvailableRooms(checkIn: Date, checkOut: Date, roomTypeId?: string) {
  if (checkIn >= checkOut) {
    throw ApiError.badRequest("checkOut must be after checkIn");
  }

  return prisma.room.findMany({
    where: {
      isActive: true,
      roomTypeId,
      reservations: {
        none: {
          status: { in: ["BOOKED", "CHECKED_IN"] },
          checkInDate: { lt: checkOut },
          checkOutDate: { gt: checkIn },
        },
      },
    },
    include: { roomType: true },
    orderBy: { roomNumber: "asc" },
  });
}

export function createRoom(input: { roomNumber: string; roomTypeId: string; floor: number }) {
  return prisma.room.create({ data: input });
}

export async function updateRoom(
  id: string,
  input: Partial<{ roomNumber: string; roomTypeId: string; floor: number; isActive: boolean }>,
) {
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Room not found");
  }
  return prisma.room.update({ where: { id }, data: input });
}

export async function updateHousekeepingStatus(id: string, status: HousekeepingStatus) {
  const existing = await prisma.room.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Room not found");
  }
  return prisma.room.update({ where: { id }, data: { housekeepingStatus: status } });
}
