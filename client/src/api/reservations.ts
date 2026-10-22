import { apiClient } from "./client";
import type { Reservation, ReservationStatus } from "../types";

export interface CreateReservationInput {
  guestId?: string;
  newGuest?: { fullName: string; email?: string; phone: string };
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
}

export async function listReservations(filters: {
  status?: ReservationStatus;
  guestId?: string;
  fromDate?: string;
  toDate?: string;
} = {}): Promise<Reservation[]> {
  const res = await apiClient.get("/reservations", { params: filters });
  return res.data.reservations;
}

export async function getReservation(id: string): Promise<Reservation> {
  const res = await apiClient.get(`/reservations/${id}`);
  return res.data.reservation;
}

export async function createReservation(input: CreateReservationInput): Promise<Reservation> {
  const res = await apiClient.post("/reservations", input);
  return res.data.reservation;
}

export async function updateReservation(
  id: string,
  input: Partial<Omit<CreateReservationInput, "guestId">>,
): Promise<Reservation> {
  const res = await apiClient.patch(`/reservations/${id}`, input);
  return res.data.reservation;
}

export async function cancelReservation(id: string): Promise<Reservation> {
  const res = await apiClient.post(`/reservations/${id}/cancel`);
  return res.data.reservation;
}

export async function deleteReservation(id: string): Promise<void> {
  await apiClient.delete(`/reservations/${id}`);
}

export async function checkInReservation(id: string, roomId?: string): Promise<Reservation> {
  const res = await apiClient.post(`/reservations/${id}/check-in`, roomId ? { roomId } : {});
  return res.data.reservation;
}

export async function checkOutReservation(id: string): Promise<Reservation> {
  const res = await apiClient.post(`/reservations/${id}/check-out`);
  return res.data.reservation;
}
