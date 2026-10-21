import { apiClient } from "./client";
import type { PaymentMethod, Reservation, Room, RoomType } from "../types";

export async function listPublicRoomTypes(): Promise<RoomType[]> {
  const res = await apiClient.get("/public/room-types");
  return res.data.roomTypes;
}

export async function findPublicAvailableRooms(checkIn: string, checkOut: string): Promise<Room[]> {
  const res = await apiClient.get("/public/rooms/availability", { params: { checkIn, checkOut } });
  return res.data.rooms;
}

export interface PublicBookingInput {
  fullName: string;
  email: string;
  phone?: string;
  roomId: string;
  checkInDate: string;
  checkOutDate: string;
  numGuests: number;
  preferredPaymentMethod?: PaymentMethod;
}

export async function createPublicReservation(input: PublicBookingInput): Promise<Reservation> {
  const res = await apiClient.post("/public/reservations", input);
  return res.data.reservation;
}

export async function getPublicReservation(id: string): Promise<Reservation> {
  const res = await apiClient.get(`/public/reservations/${id}`);
  return res.data.reservation;
}
