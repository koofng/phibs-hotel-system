import { execSync } from "node:child_process";
import { afterAll, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma.js";

beforeAll(() => {
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
});

afterAll(async () => {
  await prisma.$disconnect();
});

export async function resetDatabase() {
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.folioLineItem.deleteMany();
  await prisma.folio.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.room.deleteMany();
  await prisma.roomType.deleteMany();
  await prisma.user.deleteMany();
}
