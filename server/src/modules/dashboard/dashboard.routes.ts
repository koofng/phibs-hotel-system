import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as dashboardService from "./dashboard.service.js";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);

dashboardRouter.get("/occupancy", async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(String(req.query.date)) : new Date();
    res.json({ occupancy: await dashboardService.getOccupancy(date) });
  } catch (err) {
    next(err);
  }
});

dashboardRouter.get("/arrivals-departures", async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(String(req.query.date)) : new Date();
    res.json(await dashboardService.getArrivalsAndDepartures(date));
  } catch (err) {
    next(err);
  }
});
