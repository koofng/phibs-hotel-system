import { apiClient } from "./client";
import type { User } from "../types";

export async function login(email: string, password: string): Promise<User> {
  const res = await apiClient.post("/auth/login", { email, password });
  return res.data.user;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function fetchMe(): Promise<User> {
  const res = await apiClient.get("/auth/me");
  return res.data.user;
}
