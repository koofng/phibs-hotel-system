import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../lib/ApiError.js";

export function listGuests(search?: string) {
  if (!search) {
    return prisma.guest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  }
  return prisma.guest.findMany({
    where: {
      OR: [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getGuest(id: string) {
  const guest = await prisma.guest.findUnique({ where: { id } });
  if (!guest) {
    throw ApiError.notFound("Guest not found");
  }
  return guest;
}

export function createGuest(input: {
  fullName: string;
  email?: string;
  phone?: string;
  idDocumentNumber?: string;
  address?: string;
  notes?: string;
}) {
  return prisma.guest.create({ data: input });
}

export async function findOrCreateByEmail(input: {
  fullName: string;
  email: string;
  phone?: string;
}) {
  const existing = await prisma.guest.findFirst({
    where: { email: { equals: input.email, mode: "insensitive" } },
  });
  if (existing) {
    return existing;
  }
  return prisma.guest.create({ data: input });
}

export async function updateGuest(
  id: string,
  input: Partial<{
    fullName: string;
    email: string;
    phone: string;
    idDocumentNumber: string;
    address: string;
    notes: string;
  }>,
) {
  const existing = await prisma.guest.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Guest not found");
  }
  return prisma.guest.update({ where: { id }, data: input });
}
