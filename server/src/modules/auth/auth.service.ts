import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma.js";
import { signToken } from "../../lib/jwt.js";
import { ApiError } from "../../lib/ApiError.js";

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signToken({ userId: user.id, role: user.role });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.unauthorized();
  }
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}
