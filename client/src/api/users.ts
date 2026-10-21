import { apiClient } from "./client";
import type { Role, User } from "../types";

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}

export async function listUsers(): Promise<User[]> {
  const res = await apiClient.get("/users");
  return res.data.users;
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const res = await apiClient.post("/users", input);
  return res.data.user;
}

export async function updateUser(
  id: string,
  input: Partial<{ fullName: string; role: Role; isActive: boolean }>,
): Promise<User> {
  const res = await apiClient.patch(`/users/${id}`, input);
  return res.data.user;
}

export async function deactivateUser(id: string): Promise<User> {
  const res = await apiClient.delete(`/users/${id}`);
  return res.data.user;
}
