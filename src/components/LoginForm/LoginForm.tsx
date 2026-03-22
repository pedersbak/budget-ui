import React, { useState } from "react";
import type { LoginCredentials } from "../../auth/types";

export interface LoginFormProps {
  /** Called when the form is submitted. Should throw on failure so the error is displayed. */
  onSubmit: (credentials: LoginCredentials) => Promise<void>;
  /** Called when the user clicks the "Create account" link. */
  onRegisterClick?: () => void;
}

/**
 * A self-contained login form. Manages its own field state, loading indicator,
 * and error display. Consumers only need to provide an async `onSubmit` handler.
 */
export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, onRegisterClick }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSubmit({ username: username.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Sign in</h2>

      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <label style={styles.label}>
          Email
          <input
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
            style={styles.input}
            disabled={loading}
          />
        </label>

        <label style={styles.label}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            style={styles.input}
            disabled={loading}
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={loading ? styles.btnDisabled : styles.btn}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {onRegisterClick && (
        <p style={styles.footer}>
          Don't have an account?{" "}
          <button onClick={onRegisterClick} style={styles.link} type="button">
            Create account
          </button>
        </p>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: 360,
    padding: "2.5rem 2rem",
    borderRadius: 16,
    background: "#161b27",
    border: "1px solid #1e2638",
    boxShadow: "0 8px 32px rgba(0,0,0,0.40)",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  heading: {
    margin: "0 0 1.5rem",
    fontSize: "1.4rem",
    fontWeight: 700,
    color: "#e2e8f0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    fontSize: 13,
    fontWeight: 600,
    color: "#8892a4",
  },
  input: {
    padding: "9px 12px",
    borderRadius: 8,
    border: "1px solid #2a3347",
    background: "#0d1117",
    color: "#e2e8f0",
    fontSize: 14,
    outline: "none",
    marginTop: 2,
    fontFamily: "inherit",
  },
  error: {
    margin: 0,
    padding: "10px 12px",
    borderRadius: 8,
    background: "rgba(185,28,28,0.15)",
    border: "1px solid rgba(252,165,165,0.3)",
    color: "#fca5a5",
    fontSize: 13,
  },
  btn: {
    marginTop: 4,
    padding: "10px 0",
    borderRadius: 8,
    background: "#4f9cf9",
    color: "#fff",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  btnDisabled: {
    marginTop: 4,
    padding: "10px 0",
    borderRadius: 8,
    background: "#1e3a5f",
    color: "#4f7fb0",
    border: "none",
    fontSize: 14,
    fontWeight: 600,
    cursor: "default",
    fontFamily: "inherit",
  },
  footer: {
    marginTop: "1.25rem",
    fontSize: 13,
    color: "#8892a4",
    textAlign: "center",
  },
  link: {
    background: "none",
    border: "none",
    color: "#4f9cf9",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    padding: 0,
    fontFamily: "inherit",
  },
};
