import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../lib/ApiError.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { message: "Validation failed", details: err.flatten() },
    });
  }

  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: { message: err.message, details: err.details } });
  }

  console.error(err);
  return res.status(500).json({ error: { message: "Internal server error" } });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { message: "Not found" } });
}
