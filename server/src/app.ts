import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";
import { roomTypesRouter } from "./modules/room-types/room-types.routes.js";
import { roomsRouter } from "./modules/rooms/rooms.routes.js";
import { guestsRouter } from "./modules/guests/guests.routes.js";
import { reservationsRouter } from "./modules/reservations/reservations.routes.js";
import { billingRouter } from "./modules/billing/billing.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { publicRouter } from "./modules/public/public.routes.js";

// The built React app (client/dist). When it exists, the API server also serves
// the website, so both share one origin in production.
const clientDist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../client/dist");

export function createApp() {
  const app = express();

  if (env.trustProxy > 0) {
    app.set("trust proxy", env.trustProxy);
  }

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/api/v1/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/users", usersRouter);
  app.use("/api/v1/room-types", roomTypesRouter);
  app.use("/api/v1/rooms", roomsRouter);
  app.use("/api/v1/guests", guestsRouter);
  app.use("/api/v1/reservations", reservationsRouter);
  app.use("/api/v1/billing", billingRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/public", publicRouter);

  if (env.isProduction && existsSync(clientDist)) {
    app.use(express.static(clientDist, { index: false }));
    // Any non-API path is a client-side route; let React Router handle it.
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
