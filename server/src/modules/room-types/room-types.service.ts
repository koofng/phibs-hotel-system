import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/ApiError.js";

export function listRoomTypes() {
  return prisma.roomType.findMany({ orderBy: { basePrice: "asc" } });
}

export function createRoomType(input: {
  name: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
  amenities: string[];
}) {
  return prisma.roomType.create({ data: input });
}

export async function updateRoomType(
  id: string,
  input: Partial<{
    name: string;
    description: string;
    basePrice: number;
    maxOccupancy: number;
    amenities: string[];
  }>,
) {
  const existing = await prisma.roomType.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Room type not found");
  }
  return prisma.roomType.update({ where: { id }, data: input });
}

export async function deleteRoomType(id: string) {
  const existing = await prisma.roomType.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Room type not found");
  }
  const roomCount = await prisma.room.count({ where: { roomTypeId: id } });
  if (roomCount > 0) {
    throw ApiError.conflict("Cannot delete a room type that still has rooms assigned to it");
  }
  await prisma.roomType.delete({ where: { id } });
}
