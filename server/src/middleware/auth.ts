import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "../lib/ApiError.js";
import { verifyToken } from "../lib/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; role: Role };
    }
  }
}

export const AUTH_COOKIE_NAME = "hotel_token";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[AUTH_COOKIE_NAME];
  if (!token) {
    return next(ApiError.unauthorized());
  }

  try {
    const payload = verifyToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired session"));
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}
