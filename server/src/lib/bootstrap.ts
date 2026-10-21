import { env } from "../config/env.js";
import { prisma } from "./prisma.js";
import { hashPassword } from "../modules/auth/auth.service.js";

// Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD, but only on an empty
// database, so it never overwrites or duplicates real accounts.
export async function ensureBootstrapAdmin() {
  const { email, password, fullName } = env.bootstrapAdmin;
  if (!email || !password) return;

  if ((await prisma.user.count()) > 0) return;

  if (password.length < 8) {
    console.warn("ADMIN_PASSWORD must be at least 8 characters; skipping admin creation.");
    return;
  }

  await prisma.user.create({
    data: { email, passwordHash: await hashPassword(password), fullName, role: "ADMIN" },
  });
  console.log(`Created initial admin account ${email}`);
}
