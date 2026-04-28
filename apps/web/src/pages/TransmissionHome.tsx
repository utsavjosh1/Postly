import { Link } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import "../styles/transmission.css";

/**
 * TransmissionHome
 * ────────────────
 * Professional, neo-brutalist landing page for Postly.
 * High contrast, bold typography, and clear calls to action.
 */
export function TransmissionHome() {
  const { isAuthenticated } = useAuthStore();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--tx-bg)",
        color: "var(--tx-ink)",
        fontFamily: "var(--tx-font-display)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ─── Navigation ──────────────────────────────────────────────── */}
      <nav
        style={{
          padding: "24px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "2px solid var(--tx-border)",
          background: "var(--tx-surface)",
        }}
      >
        <div
          style={{
            fontSize: "18px",
            fontWeight: 800,
            letterSpacing: "6px",
            textTransform: "uppercase",
          }}
        >
          POSTLY
        </div>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          {!isAuthenticated ? (
            <>
              <Link
                to="/login"
                style={{
                  fontFamily: "var(--tx-font-mono)",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--tx-ink)",
                  textDecoration: "none",
                  letterSpacing: "1px",
                }}
              >
                SIGN IN
              </Link>
              <Link
                to="/join"
                className="tx-btn"
                style={{
                  background: "var(--tx-ink)",
                  color: "white",
                  padding: "8px 20px",
                  fontSize: "12px",
                  textDecoration: "none",
                }}
              >
                JOIN SIGNAL
              </Link>
            </>
          ) : (
            <Link
              target="_blank"
              to="/chat"
              className="tx-btn"
              style={{
                background: "var(--tx-ink)",
                color: "white",
                padding: "8px 20px",
                fontSize: "12px",
                textDecoration: "none",
              }}
            >
              DASHBOARD →
            </Link>
          )}
        </div>
      </nav>

      {/* ─── Hero Section ────────────────────────────────────────────── */}
      <header
        style={{
          padding: "120px 40px",
          textAlign: "center",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderBottom: "2px solid var(--tx-border)",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(48px, 10vw, 120px)",
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: "-4px",
            margin: "0 0 32px 0",
            maxWidth: "1000px",
            textTransform: "uppercase",
          }}
        >
          The Future of Work is{" "}
          <span style={{ color: "var(--tx-seeker)" }}>Broadcast</span>.
        </h1>
        <p
          style={{
            fontFamily: "var(--tx-font-mono)",
            fontSize: "clamp(16px, 1.5vw, 20px)",
            color: "var(--tx-ink-muted)",
            maxWidth: "600px",
            lineHeight: 1.5,
            marginBottom: "48px",
          }}
        >
          Postly is a high-frequency talent terminal. Stop searching. Start
          transmitting. AI-driven matching for the next generation of builders.
        </p>
        <Link
          to={isAuthenticated ? "/chat" : "/join"}
          className="tx-btn"
          style={{
            padding: "20px 48px",
            fontSize: "18px",
            fontWeight: 700,
            background: "var(--tx-ink)",
            color: "white",
            textDecoration: "none",
            boxShadow: "8px 8px 0px var(--tx-seeker)",
            transition: "all 0.1s var(--tx-ease-sharp)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-2px, -2px)";
            e.currentTarget.style.boxShadow = "10px 10px 0px var(--tx-seeker)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translate(0, 0)";
            e.currentTarget.style.boxShadow = "8px 8px 0px var(--tx-seeker)";
          }}
        >
          {isAuthenticated ? "CONTINUE TO SIGNAL →" : "GET STARTED"}
        </Link>
      </header>

      {/* ─── Footer ──────────────────────────────────────────────────── */}
      <footer
        style={{
          padding: "48px 40px",
          background: "var(--tx-ink)",
          color: "var(--tx-bg)",
          textAlign: "center",
          fontFamily: "var(--tx-font-mono)",
          fontSize: "12px",
          letterSpacing: "1px",
        }}
      >
        © {new Date().getFullYear()} POSTLY
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
  color,
}: {
  title: string;
  description: string;
  color: string;
}) {
  return (
    <div
      style={{
        padding: "60px 40px",
        borderRight: "2px solid var(--tx-border)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "4px",
          background: color,
        }}
      />
      <h3
        style={{
          fontSize: "24px",
          fontWeight: 800,
          margin: 0,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontFamily: "var(--tx-font-mono)",
          fontSize: "14px",
          color: "var(--tx-ink-muted)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {description}
      </p>
    </div>
  );
}
