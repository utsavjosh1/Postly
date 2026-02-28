import { Link } from "react-router-dom";
import "../styles/transmission.css";

/**
 * TransmissionNotFound
 * ────────────────────
 * Brutalist 404 page. Massive type, glitch effect, signal-lost metaphor.
 */
export function TransmissionNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--tx-bg)",
        fontFamily: "var(--tx-font-mono)",
        padding: "20px",
        textAlign: "center",
      }}
    >
      {/* Massive 404 */}
      <h1
        className="tx-logo-glitch"
        style={{
          fontFamily: "var(--tx-font-display)",
          fontSize: "clamp(100px, 20vw, 200px)",
          fontWeight: 900,
          color: "var(--tx-ink)",
          lineHeight: 0.9,
          letterSpacing: "-4px",
          margin: 0,
        }}
      >
        404
      </h1>

      {/* Signal lost label */}
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          margin: "24px 0 12px",
          padding: "8px 16px",
          border: "2px solid var(--tx-seeker)",
          fontFamily: "var(--tx-font-mono)",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "3px",
          textTransform: "uppercase",
          color: "var(--tx-seeker)",
        }}
      >
        <span
          className="tx-carrier-wave"
          style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            background: "var(--tx-seeker)",
          }}
        />
        SIGNAL LOST
      </div>

      <p
        style={{
          fontSize: "13px",
          color: "var(--tx-ink-muted)",
          maxWidth: "400px",
          lineHeight: 1.6,
          margin: "8px 0 32px",
        }}
      >
        The frequency you requested doesn't exist or has been discontinued.
      </p>

      {/* Navigation buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link
          to="/"
          style={{
            padding: "12px 24px",
            fontFamily: "var(--tx-font-mono)",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--tx-surface)",
            background: "var(--tx-ink)",
            border: "2px solid var(--tx-ink)",
            borderRadius: "var(--tx-radius)",
            textDecoration: "none",
            transition: "opacity 150ms var(--tx-ease-sharp)",
          }}
        >
          ← HOME
        </Link>
        <Link
          to="/chat"
          style={{
            padding: "12px 24px",
            fontFamily: "var(--tx-font-mono)",
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "var(--tx-ink)",
            background: "transparent",
            border: "2px solid var(--tx-border)",
            borderRadius: "var(--tx-radius)",
            textDecoration: "none",
            transition:
              "background-color 150ms var(--tx-ease-sharp), color 150ms var(--tx-ease-sharp)",
          }}
        >
          CHAT
        </Link>
      </div>

      {/* Divider line pulsing */}
      <div
        className="tx-carrier-wave"
        style={{
          width: "60px",
          height: "2px",
          background: "var(--tx-ink-muted)",
          marginTop: "48px",
        }}
      />
    </div>
  );
}
