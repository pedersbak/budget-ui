import React, { useState } from "react";
import type { RegisterCredentials } from "../../auth/types";

export interface RegisterFormProps {
  /** Called when the form is submitted. Should throw on failure so the error is displayed. */
  onSubmit: (credentials: RegisterCredentials) => Promise<void>;
  /** Called when the user clicks the "Sign in" link. */
  onLoginClick?: () => void;
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(
  username: string,
  email: string,
  password: string,
  confirm: string
): string | null {
  if (!username || !email || !password || !confirm) return "All fields are required.";
  if (username.length < 3) return "Username must be at least 3 characters.";
  if (!EMAIL_REGEX.test(email)) return "Please enter a valid email address.";
  if (!PASSWORD_REGEX.test(password))
    return "Password must be ≥8 characters and include uppercase, lowercase, number and special character (@$!%*?&).";
  if (password !== confirm) return "Passwords do not match.";
  return null;
}

/**
 * A self-contained registration form. Manages its own field state, loading
 * indicator, validation and error display.
 */
export const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, onLoginClick }) => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate(username, email, password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ username, email, password });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.card}>
        <div style={styles.successIcon}>✓</div>
        <h2 style={{ ...styles.heading, textAlign: "center" }}>Account created!</h2>
        <p style={{ color: "#666", fontSize: 14, textAlign: "center", margin: 0 }}>
          Your account is ready. You can now sign in.
        </p>
        {onLoginClick && (
          <button onClick={onLoginClick} style={{ ...styles.btn, marginTop: "1.5rem" }} type="button">
            Go to sign in
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={styles.card}>
      <h2 style={styles.heading}>Create account</h2>

      <form onSubmit={handleSubmit} noValidate style={styles.form}>
        <label style={styles.label}>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
            placeholder="johndoe"
            style={styles.input}
            disabled={loading}
          />
        </label>

        <label style={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            autoComplete="new-password"
            placeholder="••••••••"
            style={styles.input}
            disabled={loading}
          />
        </label>

        <label style={styles.label}>
          Confirm password
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            autoComplete="new-password"
            placeholder="••••••••"
            style={styles.input}
            disabled={loading}
          />
        </label>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" disabled={loading} style={loading ? styles.btnDisabled : styles.btn}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      {onLoginClick && (
        <p style={styles.footer}>
          Already have an account?{" "}
          <button onClick={onLoginClick} style={styles.link} type="button">
            Sign in
          </button>
        </p>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: 380,
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
    gap: "0.9rem",
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
  successIcon: {
    width: 56,
    height: 56,
    borderRadius: "50%",
    background: "rgba(16,185,129,0.15)",
    color: "#10b981",
    fontSize: 26,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 1rem",
    fontWeight: 700,
  },
};
