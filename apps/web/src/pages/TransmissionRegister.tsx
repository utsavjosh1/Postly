import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import "../styles/transmission.css";

/**
 * TransmissionRegister
 * ────────────────────
 * Neo-brutalist signup with role selector (SEEKER / EMPLOYER).
 */
export function TransmissionRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"job_seeker" | "employer">(
    "job_seeker",
  );
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ full_name: name, email, password, role: userType });
      navigate("/");
    } catch {
      // Error surfaced via store
    }
  };

  const inputStyle: React.CSSProperties = {
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
    boxSizing: "border-box" as const,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "10px",
    fontWeight: 700,
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "var(--tx-ink-muted)",
    marginBottom: "6px",
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
        <div style={{ marginBottom: "36px", textAlign: "center" }}>
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
              fontSize: "clamp(32px, 5vw, 48px)",
              fontWeight: 800,
              color: "var(--tx-ink)",
              margin: "16px 0 8px",
              lineHeight: 1,
              letterSpacing: "-1px",
            }}
          >
            CREATE ACCOUNT
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "var(--tx-ink-muted)",
              letterSpacing: "1px",
              textTransform: "uppercase",
            }}
          >
            Join the signal
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
          {error && (
            <div
              style={{
                padding: "10px 14px",
                border: "2px solid var(--tx-seeker)",
                background: "rgba(255,61,0,0.06)",
                color: "var(--tx-seeker)",
                fontSize: "12px",
                marginBottom: "20px",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>FULL NAME</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Jane Doe"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--tx-ink)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--tx-border)")
                }
              />
            </div>

            {/* Email */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--tx-ink)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--tx-border)")
                }
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--tx-ink)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--tx-border)")
                }
              />
              <p
                style={{
                  fontSize: "10px",
                  color: "var(--tx-ink-muted)",
                  marginTop: "4px",
                  letterSpacing: "0.5px",
                }}
              >
                Min. 8 characters
              </p>
            </div>

            {/* Role selector */}
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>I AM A...</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setUserType("job_seeker")}
                  style={{
                    padding: "12px",
                    fontFamily: "var(--tx-font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color:
                      userType === "job_seeker"
                        ? "var(--tx-surface)"
                        : "var(--tx-ink)",
                    background:
                      userType === "job_seeker"
                        ? "var(--tx-seeker)"
                        : "var(--tx-bg)",
                    border: `2px solid ${userType === "job_seeker" ? "var(--tx-seeker)" : "var(--tx-border)"}`,
                    borderRadius: "var(--tx-radius)",
                    cursor: "pointer",
                    transition: "all 150ms var(--tx-ease-sharp)",
                  }}
                >
                  SEEKER
                </button>
                <button
                  type="button"
                  onClick={() => setUserType("employer")}
                  style={{
                    padding: "12px",
                    fontFamily: "var(--tx-font-mono)",
                    fontSize: "12px",
                    fontWeight: 700,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color:
                      userType === "employer"
                        ? "var(--tx-surface)"
                        : "var(--tx-ink)",
                    background:
                      userType === "employer"
                        ? "var(--tx-recruiter)"
                        : "var(--tx-bg)",
                    border: `2px solid ${userType === "employer" ? "var(--tx-recruiter)" : "var(--tx-border)"}`,
                    borderRadius: "var(--tx-radius)",
                    cursor: "pointer",
                    transition: "all 150ms var(--tx-ease-sharp)",
                  }}
                >
                  EMPLOYER
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
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
              {isLoading ? "···" : "CREATE ACCOUNT →"}
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
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "var(--tx-ink)",
              fontWeight: 700,
              textDecoration: "none",
              borderBottom: "2px solid var(--tx-ink)",
            }}
          >
            SIGN IN
          </Link>
        </p>
      </div>
    </div>
  );
}
