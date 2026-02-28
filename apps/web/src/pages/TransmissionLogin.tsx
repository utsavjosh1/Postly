import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import "../styles/transmission.css";

/**
 * TransmissionLogin
 * ─────────────────
 * Neo-brutalist login page. Hard borders, monospace, warm concrete background.
 */
export function TransmissionLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const urlError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate("/");
    } catch {
      // Error handled by store
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
        {/* Header */}
        <div style={{ marginBottom: "40px", textAlign: "center" }}>
          <Link
            to="/"
            style={{
              fontFamily: "var(--tx-font-display)",
              fontSize: "14px",
              fontWeight: 800,
              letterSpacing: "6px",
              textTransform: "uppercase",
              color: "var(--tx-ink)",
              textDecoration: "none",
            }}
          >
            POSTLY
          </Link>
          <h1
            style={{
              fontFamily: "var(--tx-font-display)",
              fontSize: "clamp(36px, 6vw, 52px)",
              fontWeight: 800,
              color: "var(--tx-ink)",
              margin: "16px 0 8px",
              lineHeight: 1,
              letterSpacing: "-1px",
            }}
          >
            SIGN IN
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "var(--tx-ink-muted)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Access your transmission
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: "var(--tx-surface)",
            border: "2px solid var(--tx-border)",
            borderRadius: "var(--tx-radius)",
            padding: "32px 28px",
          }}
        >
          {/* Error */}
          {(error || urlError) && (
            <div
              style={{
                padding: "10px 14px",
                border: "2px solid var(--tx-seeker)",
                background: "rgba(255,61,0,0.06)",
                color: "var(--tx-seeker)",
                fontSize: "12px",
                marginBottom: "20px",
                letterSpacing: "0.5px",
              }}
            >
              {error ||
                (urlError === "access_denied"
                  ? "ACCESS DENIED"
                  : "AUTHENTICATION FAILED")}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
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

            {/* Password */}
            <div style={{ marginBottom: "8px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "6px",
                }}
              >
                <label
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "var(--tx-ink-muted)",
                  }}
                >
                  PASSWORD
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "10px",
                    color: "var(--tx-ink-muted)",
                    textDecoration: "none",
                    letterSpacing: "1px",
                    transition: "color 150ms var(--tx-ease-sharp)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--tx-ink)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--tx-ink-muted)")
                  }
                >
                  FORGOT?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
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

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "24px",
                fontFamily: "var(--tx-font-mono)",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--tx-surface)",
                background: "var(--tx-ink)",
                border: "2px solid var(--tx-ink)",
                borderRadius: "var(--tx-radius)",
                cursor: isLoading ? "not-allowed" : "pointer",
                opacity: isLoading ? 0.6 : 1,
                transition:
                  "opacity 150ms var(--tx-ease-sharp), transform 100ms var(--tx-ease-sharp)",
              }}
              onMouseDown={(e) => {
                if (!isLoading)
                  e.currentTarget.style.transform = "scaleX(0.98)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scaleX(1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scaleX(1)";
              }}
            >
              {isLoading ? "···" : "TRANSMIT →"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: "11px",
            color: "var(--tx-ink-muted)",
            marginTop: "24px",
            letterSpacing: "0.5px",
          }}
        >
          No account?{" "}
          <Link
            to="/register"
            style={{
              color: "var(--tx-ink)",
              fontWeight: 700,
              textDecoration: "none",
              borderBottom: "2px solid var(--tx-ink)",
              transition: "border-color 150ms var(--tx-ease-sharp)",
            }}
          >
            SIGN UP
          </Link>
        </p>
      </div>
    </div>
  );
}
