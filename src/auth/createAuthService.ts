import type { AuthTokens, LoginCredentials, RegisterCredentials } from "./types";

export interface AuthServiceConfig {
  /** Base URL of the auth API, e.g. "https://netvrk.nu" or "http://localhost:5039". */
  baseUrl: string;
}

export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthTokens>;
  register(credentials: RegisterCredentials): Promise<void>;
  refresh(refreshToken: string): Promise<AuthTokens>;
}

async function extractErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.clone().json() as Record<string, unknown>;
    if (typeof data["message"] === "string") return data["message"];
  } catch { /* ignore */ }
  try {
    const text = await res.text();
    if (text.includes("User already exists")) return "A user with this email already exists.";
    if (text) return text;
  } catch { /* ignore */ }
  return fallback;
}

/**
 * Creates an auth service bound to a specific API base URL.
 * Can be used standalone or passed to `AuthProvider`.
 *
 * Endpoints used:
 *  - POST {baseUrl}/Auth/login          → { token, refreshToken }
 *  - POST {baseUrl}/Auth/register       → 200 OK or error
 *  - POST {baseUrl}/Auth/refreshtoken   → { token, refreshToken? }
 */
export function createAuthService(config: AuthServiceConfig): AuthService {
  const base = config.baseUrl.replace(/\/$/, "");

  return {
    async login(credentials) {
      const res = await fetch(`${base}/Auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password,
        }),
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "Login failed. Check your credentials.");
        throw new Error(msg);
      }
      return res.json() as Promise<AuthTokens>;
    },

    async register(credentials) {
      const res = await fetch(`${base}/Auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: credentials.email,
          password: credentials.password,
        }),
      });
      if (!res.ok) {
        const msg = await extractErrorMessage(res, "Registration failed.");
        throw new Error(msg);
      }
    },

    async refresh(refreshToken) {
      const res = await fetch(`${base}/Auth/refreshtoken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) {
        throw new Error("Token refresh failed. Please log in again.");
      }
      const data = await res.json() as { token: string; refreshToken?: string };
      return {
        token: data.token,
        // Some APIs rotate the refresh token; fall back to the existing one if not.
        refreshToken: data.refreshToken ?? refreshToken,
      };
    },
  };
}
