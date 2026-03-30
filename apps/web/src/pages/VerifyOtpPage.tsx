import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import "../styles/transmission.css";

/**
 * VerifyOtpPage
 * ─────────────
 * Neo-brutalist verification page for 6-digit email OTP.
 */
export function VerifyOtpPage() {
  const [code, setCode] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp, isLoading, error } = useAuthStore();
  const email = searchParams.get("email") || "";
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [resendTimer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) return;
    try {
      await verifyOtp({ email, code });
      navigate("/chat?role=seeker");
    } catch {
      // Error handled by store
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    try {
      await resendOtp(email);
      setResendTimer(60);
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
              fontSize: "clamp(36px, 6vw, 48px)",
              fontWeight: 800,
              color: "var(--tx-ink)",
              margin: "16px 0 8px",
              lineHeight: 1,
              letterSpacing: "-1px",
            }}
          >
            VERIFY EMAIL
          </h1>
          <p
            style={{
              fontSize: "12px",
              color: "var(--tx-ink-muted)",
              letterSpacing: "0.5px",
            }}
          >
            SENT TO:{" "}
            <span style={{ color: "var(--tx-ink)", fontWeight: 700 }}>
              {email}
            </span>
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
          {error && (
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
              {error.toUpperCase()}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* OTP Code */}
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "var(--tx-ink-muted)",
                  marginBottom: "8px",
                }}
              >
                6-DIGIT CODE
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                maxLength={6}
                placeholder="000000"
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "var(--tx-bg)",
                  border: "2px solid var(--tx-border)",
                  borderRadius: "var(--tx-radius)",
                  fontFamily: "var(--tx-font-mono)",
                  fontSize: "32px",
                  fontWeight: 800,
                  letterSpacing: "12px",
                  color: "var(--tx-ink)",
                  textAlign: "center",
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
              disabled={isLoading || code.length !== 6}
              style={{
                width: "100%",
                padding: "14px",
                marginTop: "12px",
                fontFamily: "var(--tx-font-mono)",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "var(--tx-surface)",
                background: "var(--tx-ink)",
                border: "2px solid var(--tx-ink)",
                borderRadius: "var(--tx-radius)",
                cursor:
                  isLoading || code.length !== 6 ? "not-allowed" : "pointer",
                opacity: isLoading || code.length !== 6 ? 0.6 : 1,
                transition:
                  "opacity 150ms var(--tx-ease-sharp), transform 100ms var(--tx-ease-sharp)",
              }}
              onMouseDown={(e) => {
                if (!isLoading && code.length === 6)
                  e.currentTarget.style.transform = "scaleX(0.98)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "scaleX(1)";
              }}
            >
              {isLoading ? "···" : "VERIFY CODE →"}
            </button>
          </form>

          {/* Resend */}
          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <button
              onClick={handleResend}
              disabled={isLoading || resendTimer > 0}
              style={{
                background: "none",
                border: "none",
                color:
                  isLoading || resendTimer > 0
                    ? "var(--tx-ink-muted)"
                    : "var(--tx-ink)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor:
                  isLoading || resendTimer > 0 ? "not-allowed" : "pointer",
                padding: "4px 8px",
                borderBottom:
                  resendTimer === 0 ? "2px solid var(--tx-ink)" : "none",
                transition: "opacity 150ms var(--tx-ease-sharp)",
              }}
            >
              {resendTimer > 0 ? `RESEND IN ${resendTimer}S` : "RESEND CODE"}
            </button>
          </div>
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
          WANT TO START OVER?{" "}
          <Link
            to="/register"
            style={{
              color: "var(--tx-ink)",
              fontWeight: 700,
              textDecoration: "none",
              borderBottom: "2px solid var(--tx-ink)",
            }}
          >
            JOIN AGAIN
          </Link>
        </p>
      </div>
    </div>
  );
}
