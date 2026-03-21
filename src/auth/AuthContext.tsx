import React, {
  createContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { AuthContextValue, AuthTokens, LoginCredentials, RegisterCredentials } from "./types";
import { createAuthService } from "./createAuthService";
import { saveTokens, loadTokens, clearTokens } from "./authStorage";
import { decodeJwtUser } from "./decodeJwt";

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  /**
   * Base URL of the auth API.
   * @example "https://netvrk.nu"
   * @example "http://localhost:5039"
   */
  baseUrl: string;
  children: React.ReactNode;
}

/**
 * Provides authentication state and actions to the component tree.
 * Wrap your application (or the protected part of it) with this provider.
 *
 * @example
 * <AuthProvider baseUrl="https://netvrk.nu">
 *   <App />
 * </AuthProvider>
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ baseUrl, children }) => {
  const service = useMemo(() => createAuthService({ baseUrl }), [baseUrl]);

  // Seed from sessionStorage so the user stays logged in on page refresh.
  const [tokens, setTokens] = useState<AuthTokens | null>(() => loadTokens());

  const user = useMemo(
    () => (tokens ? decodeJwtUser(tokens.token) : null),
    [tokens]
  );

  const applyTokens = useCallback((t: AuthTokens) => {
    saveTokens(t);
    setTokens(t);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const t = await service.login(credentials);
      applyTokens(t);
    },
    [service, applyTokens]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      await service.register(credentials);
    },
    [service]
  );

  const logout = useCallback(() => {
    clearTokens();
    setTokens(null);
  }, []);

  const refreshTokens = useCallback(async (): Promise<AuthTokens | null> => {
    const current = loadTokens();
    if (!current?.refreshToken) return null;
    try {
      const t = await service.refresh(current.refreshToken);
      applyTokens(t);
      return t;
    } catch {
      clearTokens();
      setTokens(null);
      return null;
    }
  }, [service, applyTokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      tokens,
      isAuthenticated: !!tokens,
      login,
      register,
      logout,
      refreshTokens,
    }),
    [user, tokens, login, register, logout, refreshTokens]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
