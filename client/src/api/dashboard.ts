import { apiClient } from "./client";
import type { OccupancyRoom, Reservation } from "../types";

export async function getOccupancy(date?: string): Promise<OccupancyRoom[]> {
  const res = await apiClient.get("/dashboard/occupancy", { params: date ? { date } : {} });
  return res.data.occupancy;
}

export async function getArrivalsDepartures(
  date?: string,
): Promise<{ arrivals: Reservation[]; departures: Reservation[] }> {
  const res = await apiClient.get("/dashboard/arrivals-departures", { params: date ? { date } : {} });
  return res.data;
}
