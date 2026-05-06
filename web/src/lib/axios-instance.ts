import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const dotnetApiUrl = (process.env.NEXT_PUBLIC_DOTNET_API_URL ?? "").replace(/\/$/, "");

/** Routes that must stay on the Next server (Prisma, cookies, student self-service). */
function isNextOriginApiPath(path: string): boolean {
  const p = path.split("?")[0] ?? "";
  return (
    p === "/api/auth/me" ||
    p.startsWith("/api/auth/register") ||
    p.startsWith("/api/me/") ||
    p.startsWith("/api/auth/password") ||
    p.startsWith("/api/auth/bootstrap-session") ||
    p.startsWith("/api/auth/logout")
  );
}

const DOTNET_JWT_STORAGE_KEY = "cm_dotnet_bearer";

export function isDotnetBackendEnabled(): boolean {
  return dotnetApiUrl.length > 0;
}

export function setDotnetSessionToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) sessionStorage.setItem(DOTNET_JWT_STORAGE_KEY, token);
  else sessionStorage.removeItem(DOTNET_JWT_STORAGE_KEY);
}

export function clearDotnetSessionToken(): void {
  setDotnetSessionToken(null);
}

/**
 * Axios: same-origin `/api/*` when .NET backend is disabled.
 * With `NEXT_PUBLIC_DOTNET_API_URL`, admin/resource calls go to the ASP.NET API
 * with `Authorization: Bearer` (JWT from login/register).
 */
export const api = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const rawUrl = typeof config.url === "string" ? config.url : "";
  const pathOnly = rawUrl.split("?")[0];
  const useNextOnly = !isDotnetBackendEnabled() || isNextOriginApiPath(pathOnly);

  if (useNextOnly) {
    config.baseURL = "";
    config.withCredentials = true;
    return config;
  }

  config.baseURL = dotnetApiUrl;
  config.withCredentials = false;
  if (typeof window !== "undefined") {
    const bearer = sessionStorage.getItem(DOTNET_JWT_STORAGE_KEY);
    if (bearer) {
      config.headers.set("Authorization", `Bearer ${bearer}`);
    }
  }
  return config;
});

export function getAxiosErrorMessage(err: unknown): string {
  const e = err as AxiosError<{ error?: string }>;
  if (e.response?.data && typeof e.response.data.error === "string") {
    return e.response.data.error;
  }
  if (e instanceof Error && e.message) return e.message;
  return "Request failed";
}
