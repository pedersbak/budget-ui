import type { AuthTokens } from "./types";

const TOKEN_KEY = "iris_auth_token";
const REFRESH_TOKEN_KEY = "iris_auth_refresh_token";

export function saveTokens(tokens: AuthTokens): void {
  sessionStorage.setItem(TOKEN_KEY, tokens.token);
  sessionStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
}

export function loadTokens(): AuthTokens | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
  if (!token || !refreshToken) return null;
  return { token, refreshToken };
}

export function clearTokens(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}
