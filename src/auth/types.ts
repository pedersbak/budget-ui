/** Tokens returned by the login and refresh endpoints. */
export interface AuthTokens {
  token: string;
  refreshToken: string;
}

/** Credentials sent to the login endpoint. */
export interface LoginCredentials {
  /** Email address used as the username. */
  username: string;
  password: string;
}

/** Credentials sent to the register endpoint. */
export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
}

/** Minimal user info decoded from the JWT payload. */
export interface AuthUser {
  id: string;
  email: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
  /** Refresh the access token using the stored refresh token.
   *  Returns the new tokens, or null if refresh failed (user is logged out). */
  refreshTokens: () => Promise<AuthTokens | null>;
}
