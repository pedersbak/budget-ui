import type { AuthUser } from "./types";

/**
 * Decode the payload of a JWT and extract basic user info.
 * Works for any JWT — no signature verification is performed.
 */
export function decodeJwtUser(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1])) as Record<string, unknown>;
    const email = String(
      payload["unique_name"] ??
        payload["email"] ??
        payload["sub"] ??
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] ??
        ""
    );
    const id = String(payload["nameid"] ?? payload["sub"] ?? "");
    return { id, email };
  } catch {
    return null;
  }
}
