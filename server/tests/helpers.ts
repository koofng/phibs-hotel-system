import bcrypt from "bcrypt";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

export const app = createApp();

export async function createUser(overrides: Partial<{ email: string; role: "ADMIN" | "FRONT_DESK" }> = {}) {
  const passwordHash = await bcrypt.hash("password123", 10);
  return prisma.user.create({
    data: {
      email: overrides.email ?? `user-${Date.now()}-${Math.random()}@example.com`,
      passwordHash,
      fullName: "Test User",
      role: overrides.role ?? "ADMIN",
    },
  });
}

export async function loginAgent(email: string, password = "password123") {
  const agent = request.agent(app);
  await agent.post("/api/v1/auth/login").send({ email, password }).expect(200);
  return agent;
}

export async function createRoomType(overrides: Partial<{ basePrice: number }> = {}) {
  return prisma.roomType.create({
    data: {
      name: `Room Type ${Date.now()}-${Math.random()}`,
      basePrice: overrides.basePrice ?? 100,
      maxOccupancy: 2,
      amenities: [],
    },
  });
}

export async function createRoom(roomTypeId: string) {
  return prisma.room.create({
    data: {
      roomNumber: `${Math.floor(Math.random() * 100000)}`,
      roomTypeId,
      floor: 1,
    },
  });
}

export async function createGuest() {
  return prisma.guest.create({ data: { fullName: "Test Guest" } });
}
