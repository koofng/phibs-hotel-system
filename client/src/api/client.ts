import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api/v1",
  withCredentials: true,
});

export interface ApiErrorBody {
  error: { message: string; details?: unknown };
}

export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const body = err.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
