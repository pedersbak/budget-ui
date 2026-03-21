import { useContext } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthContextValue } from "./types";

/**
 * Returns the current authentication context.
 * Must be called inside a component wrapped by `<AuthProvider>`.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside an <AuthProvider>.");
  }
  return ctx;
}
