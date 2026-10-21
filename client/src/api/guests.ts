import { apiClient } from "./client";
import type { Guest } from "../types";

export interface GuestInput {
  fullName: string;
  email?: string;
  phone?: string;
  idDocumentNumber?: string;
  address?: string;
  notes?: string;
}

export async function listGuests(search?: string): Promise<Guest[]> {
  const res = await apiClient.get("/guests", { params: search ? { search } : {} });
  return res.data.guests;
}

export async function getGuest(id: string): Promise<Guest> {
  const res = await apiClient.get(`/guests/${id}`);
  return res.data.guest;
}

export async function createGuest(input: GuestInput): Promise<Guest> {
  const res = await apiClient.post("/guests", input);
  return res.data.guest;
}

export async function updateGuest(id: string, input: Partial<GuestInput>): Promise<Guest> {
  const res = await apiClient.patch(`/guests/${id}`, input);
  return res.data.guest;
}
