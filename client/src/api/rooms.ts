import { apiClient } from "./client";
import type { HousekeepingStatus, Room } from "../types";

export interface RoomInput {
  roomNumber: string;
  roomTypeId: string;
  floor: number;
}

export async function listRooms(filters: { housekeepingStatus?: string; roomTypeId?: string } = {}): Promise<Room[]> {
  const res = await apiClient.get("/rooms", { params: filters });
  return res.data.rooms;
}

export async function findAvailableRooms(checkIn: string, checkOut: string, roomTypeId?: string): Promise<Room[]> {
  const res = await apiClient.get("/rooms/availability", { params: { checkIn, checkOut, roomTypeId } });
  return res.data.rooms;
}

export async function createRoom(input: RoomInput): Promise<Room> {
  const res = await apiClient.post("/rooms", input);
  return res.data.room;
}

export async function updateRoom(id: string, input: Partial<RoomInput & { isActive: boolean }>): Promise<Room> {
  const res = await apiClient.patch(`/rooms/${id}`, input);
  return res.data.room;
}

export async function updateHousekeepingStatus(id: string, status: HousekeepingStatus): Promise<Room> {
  const res = await apiClient.patch(`/rooms/${id}/housekeeping-status`, { housekeepingStatus: status });
  return res.data.room;
}
