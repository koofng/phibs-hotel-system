import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../auth/auth.service.js";
import { ApiError } from "../../lib/ApiError.js";
import type { Role } from "@prisma/client";

const userSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  createdAt: true,
} as const;

export function listUsers() {
  return prisma.user.findMany({ select: userSelect, orderBy: { createdAt: "desc" } });
}

export async function createUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      passwordHash,
    },
    select: userSelect,
  });
}

export async function updateUser(
  id: string,
  input: Partial<{ role: Role; isActive: boolean; fullName: string }>,
) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  return prisma.user.update({ where: { id }, data: input, select: userSelect });
}

export async function deactivateUser(id: string) {
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("User not found");
  }

  return prisma.user.update({
    where: { id },
    data: { isActive: false },
    select: userSelect,
  });
}
