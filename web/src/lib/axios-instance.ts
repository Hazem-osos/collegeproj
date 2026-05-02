import axios, { AxiosError } from "axios";

/**
 * All browser calls hit same-origin `/api/*` so cookies flow with lax same-site rules.
 * `withCredentials: true` preserves cookies when the frontend is proxied behind another origin later.
 */
export const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function getAxiosErrorMessage(err: unknown): string {
  const e = err as AxiosError<{ error?: string }>;
  if (e.response?.data && typeof e.response.data.error === "string") {
    return e.response.data.error;
  }
  if (e instanceof Error && e.message) return e.message;
  return "Request failed";
}
