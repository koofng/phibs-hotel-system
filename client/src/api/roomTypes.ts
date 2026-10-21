import { apiClient } from "./client";
import type { RoomType } from "../types";

export interface RoomTypeInput {
  name: string;
  description?: string;
  basePrice: number;
  maxOccupancy: number;
  amenities: string[];
}

export async function listRoomTypes(): Promise<RoomType[]> {
  const res = await apiClient.get("/room-types");
  return res.data.roomTypes;
}

export async function createRoomType(input: RoomTypeInput): Promise<RoomType> {
  const res = await apiClient.post("/room-types", input);
  return res.data.roomType;
}

export async function updateRoomType(id: string, input: Partial<RoomTypeInput>): Promise<RoomType> {
  const res = await apiClient.patch(`/room-types/${id}`, input);
  return res.data.roomType;
}

export async function deleteRoomType(id: string): Promise<void> {
  await apiClient.delete(`/room-types/${id}`);
}
