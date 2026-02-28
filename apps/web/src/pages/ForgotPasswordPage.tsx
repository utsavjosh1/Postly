import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/auth.service";
import "../styles/transmission.css";

/**
 * ForgotPasswordPage — Transmission styled
 */
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await authService.forgotPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--tx-bg)",
        fontFamily: "var(--tx-font-mono)",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <Link
            to="/"
            style={{
              fontFamily: "var(--tx-font-display)",
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "6px",
              color: "var(--tx-ink)",
              textDecoration: "none",
              textTransform: "uppercase",
            }}
          >
            POSTLY
          </Link>
          <h1
            style={{
              fontFamily: "var(--tx-font-display)",
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 800,
              color: "var(--tx-ink)",
              margin: "16px 0 8px",
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            RESET PASSWORD
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "var(--tx-ink-muted)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Recover your transmission
          </p>
        </div>

        <div
          style={{
            background: "var(--tx-surface)",
            border: "2px solid var(--tx-border)",
            borderRadius: "var(--tx-radius)",
            padding: "32px 28px",
          }}
        >
          <Link
            to="/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "11px",
              color: "var(--tx-ink-muted)",
              textDecoration: "none",
              marginBottom: "20px",
              letterSpacing: "1px",
            }}
          >
            ← BACK TO LOGIN
          </Link>

          {isSuccess ? (
            <div
              style={{
                padding: "20px",
                border: "2px solid var(--tx-ink)",
                textAlign: "center",
              }}
            >
              <h3
                style={{
                  fontFamily: "var(--tx-font-display)",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--tx-ink)",
                  marginBottom: "8px",
                }}
              >
                CHECK YOUR EMAIL
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--tx-ink-muted)",
                  marginBottom: "16px",
                  lineHeight: 1.5,
                }}
              >
                Reset link sent to {email}
              </p>
              <Link
                to="/login"
                style={{
                  display: "inline-block",
                  padding: "10px 20px",
                  fontFamily: "var(--tx-font-mono)",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--tx-surface)",
                  background: "var(--tx-ink)",
                  border: "2px solid var(--tx-ink)",
                  textDecoration: "none",
                }}
              >
                RETURN TO LOGIN
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    padding: "10px 14px",
                    border: "2px solid var(--tx-seeker)",
                    background: "rgba(255,61,0,0.06)",
                    color: "var(--tx-seeker)",
                    fontSize: "12px",
                    marginBottom: "16px",
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "var(--tx-ink-muted)",
                    marginBottom: "6px",
                  }}
                >
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  style={{
                    width: "100%",
                    padding: "12px 14px",
                    background: "var(--tx-bg)",
                    border: "2px solid var(--tx-border)",
                    borderRadius: "var(--tx-radius)",
                    fontFamily: "var(--tx-font-mono)",
                    fontSize: "13px",
                    color: "var(--tx-ink)",
                    outline: "none",
                    transition: "border-color 150ms var(--tx-ease-sharp)",
                    boxSizing: "border-box",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--tx-ink)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "var(--tx-border)")
                  }
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: "100%",
                  padding: "14px",
                  fontFamily: "var(--tx-font-mono)",
                  fontSize: "13px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--tx-surface)",
                  background: "var(--tx-ink)",
                  border: "2px solid var(--tx-ink)",
                  borderRadius: "var(--tx-radius)",
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  opacity: isSubmitting ? 0.6 : 1,
                  transition: "opacity 150ms var(--tx-ease-sharp)",
                }}
              >
                {isSubmitting ? "···" : "SEND RESET LINK →"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
