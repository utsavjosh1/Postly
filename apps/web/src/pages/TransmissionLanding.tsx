import { useEffect, useRef, useState } from "react";
import {
  TransmissionTransition,
  useTransmissionTransition,
} from "../components/chat/TransmissionTransition";
import "../styles/transmission.css";

/**
 * TransmissionLanding
 * ───────────────────
 * Full-viewport split-screen role selection.
 * Left = SEEKING (orange-red) | Right = HIRING (blue)
 *
 * Animations (all CSS-only, JS toggles classes):
 * - clip-path split on mount
 * - translateY headline drop (staggered 150ms)
 * - SVG stroke-dashoffset border trace on hover
 * - carrier-wave pulse on center dividing line
 * - skewX logo glitch at 800ms, once
 * - clip-path circle transition on click
 */

export function TransmissionLanding() {
  const [mounted, setMounted] = useState(false);
  const { state: transState, trigger } = useTransmissionTransition();
  const seekerRef = useRef<HTMLDivElement>(null);
  const recruiterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger mount animations via class toggle
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const handleRoleClick = (
    role: "seeker" | "recruiter",
    e: React.MouseEvent,
  ) => {
    trigger(role, e.clientX, e.clientY);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          fontFamily: "var(--tx-font-display)",
          background: "var(--tx-ink)",
          overflow: "hidden",
        }}
      >
        {/* ─── Logo / App Name ─────────────────────────────────────────
        <div
          className={mounted ? "tx-logo-glitch" : ""}
          style={{
            position: "absolute",
            top: "28px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 20,
            fontFamily: "var(--tx-font-mono)",
            fontSize: "13px",
            fontWeight: 700,
            letterSpacing: "6px",
            textTransform: "uppercase",
            color: "var(--tx-bg)",
            userSelect: "none",
          }}
        >
          POSTLY
        </div> */}

        {/* ─── LEFT PANEL: SEEKING ───────────────────────────────────── */}
        <div
          ref={seekerRef}
          className={`tx-panel tx-panel-seeker tx-cursor-seeker ${mounted ? "tx-split-left" : ""}`}
          onClick={(e) => handleRoleClick("seeker", e)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0D0D0D",
            position: "relative",
            opacity: mounted ? undefined : 0,
          }}
        >
          {/* SVG border trace overlay */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 10,
            }}
            preserveAspectRatio="none"
          >
            <rect
              className="tx-border-trace"
              x="4"
              y="4"
              width="calc(100% - 8px)"
              height="calc(100% - 8px)"
              fill="none"
              stroke="var(--tx-seeker)"
              strokeWidth="2"
              style={
                {
                  "--tx-perimeter": "6000",
                  rx: 0,
                  ry: 0,
                } as React.CSSProperties
              }
            />
          </svg>

          {/* Content */}
          <div style={{ position: "relative", zIndex: 5, textAlign: "center" }}>
            <h1
              className={mounted ? "tx-headline-drop" : ""}
              style={{
                fontFamily: "var(--tx-font-display)",
                fontSize: "clamp(48px, 10vw, 120px)",
                fontWeight: 700,
                color: "var(--tx-seeker)",
                lineHeight: 0.9,
                letterSpacing: "-2px",
                margin: 0,
                opacity: 0,
                userSelect: "none",
              }}
            >
              SEEKING
            </h1>
            <p
              className={mounted ? "tx-headline-drop-delay" : ""}
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "clamp(11px, 1.2vw, 14px)",
                fontWeight: 400,
                color: "var(--tx-ink-muted)",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginTop: "20px",
                opacity: 0,
              }}
            >
              I&apos;m looking for work
            </p>
          </div>

          {/* Bottom label */}
          <div
            style={{
              position: "absolute",
              bottom: "32px",
              fontFamily: "var(--tx-font-mono)",
              fontSize: "11px",
              color: "var(--tx-ink-muted)",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            Click to enter →
          </div>
        </div>

        {/* ─── CENTER DIVIDING LINE ──────────────────────────────────── */}
        <div
          className={mounted ? "tx-carrier-wave" : ""}
          style={{
            width: "2px",
            background: "var(--tx-bg)",
            zIndex: 15,
            flexShrink: 0,
          }}
        />

        {/* ─── RIGHT PANEL: HIRING ───────────────────────────────────── */}
        <div
          ref={recruiterRef}
          className={`tx-panel tx-panel-recruiter tx-cursor-recruiter ${mounted ? "tx-split-right" : ""}`}
          onClick={(e) => handleRoleClick("recruiter", e)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0D0D0D",
            position: "relative",
            opacity: mounted ? undefined : 0,
          }}
        >
          {/* SVG border trace overlay */}
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              zIndex: 10,
            }}
            preserveAspectRatio="none"
          >
            <rect
              className="tx-border-trace"
              x="4"
              y="4"
              width="calc(100% - 8px)"
              height="calc(100% - 8px)"
              fill="none"
              stroke="var(--tx-recruiter)"
              strokeWidth="2"
              style={
                {
                  "--tx-perimeter": "6000",
                  rx: 0,
                  ry: 0,
                } as React.CSSProperties
              }
            />
          </svg>

          {/* Content */}
          <div style={{ position: "relative", zIndex: 5, textAlign: "center" }}>
            <h1
              className={mounted ? "tx-headline-drop-delay" : ""}
              style={{
                fontFamily: "var(--tx-font-display)",
                fontSize: "clamp(48px, 10vw, 120px)",
                fontWeight: 700,
                color: "var(--tx-recruiter)",
                lineHeight: 0.9,
                letterSpacing: "-2px",
                margin: 0,
                opacity: 0,
                userSelect: "none",
              }}
            >
              HIRING
            </h1>
            <p
              className={mounted ? "tx-headline-drop-delay" : ""}
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "clamp(11px, 1.2vw, 14px)",
                fontWeight: 400,
                color: "var(--tx-ink-muted)",
                letterSpacing: "3px",
                textTransform: "uppercase",
                marginTop: "20px",
                opacity: 0,
              }}
            >
              I&apos;m looking for talent
            </p>
          </div>

          {/* Bottom label */}
          <div
            style={{
              position: "absolute",
              bottom: "32px",
              fontFamily: "var(--tx-font-mono)",
              fontSize: "11px",
              color: "var(--tx-ink-muted)",
              letterSpacing: "2px",
              textTransform: "uppercase",
            }}
          >
            ← Click to enter
          </div>
        </div>

        {/* ─── Bottom frequency bar decoration ────────────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "3px",
            display: "flex",
            zIndex: 20,
          }}
        >
          <div style={{ flex: 1, background: "var(--tx-seeker)" }} />
          <div style={{ flex: 1, background: "var(--tx-recruiter)" }} />
        </div>
      </div>

      {/* Transition overlay */}
      <TransmissionTransition state={transState} />
    </>
  );
}
