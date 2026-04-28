import React from "react";
import "../../styles/transmission.css";

export const PageLoader: React.FC = () => {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--tx-bg)",
        color: "var(--tx-ink)",
        fontFamily: "var(--tx-font-mono)",
        gap: "32px",
        zIndex: 1000,
      }}
    >
      <style>
        {`
          @keyframes runner-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          @keyframes leg-left {
            0%, 100% { transform: rotate(-20deg); }
            50% { transform: rotate(40deg); }
          }
          @keyframes leg-right {
            0%, 100% { transform: rotate(40deg); }
            50% { transform: rotate(-20deg); }
          }
          @keyframes speed-line {
            0% { transform: translateX(100px); opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { transform: translateX(-100px); opacity: 0; }
          }
        `}
      </style>

      {/* ─── Animated Runner SVG ────────────────────────────────────── */}
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        {/* Speed Lines */}
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "0",
            width: "40px",
            height: "3px",
            background: "var(--tx-ink)",
            animation: "speed-line 0.6s linear infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "60%",
            left: "-20px",
            width: "60px",
            height: "3px",
            background: "var(--tx-ink)",
            animation: "speed-line 0.6s linear infinite 0.2s",
          }}
        />

        <svg
          viewBox="0 0 100 100"
          style={{
            width: "100%",
            height: "100%",
            animation: "runner-bob 0.4s ease-in-out infinite",
          }}
        >
          {/* Head */}
          <circle
            cx="65"
            cy="25"
            r="12"
            fill="var(--tx-bg)"
            stroke="var(--tx-ink)"
            strokeWidth="4"
          />
          {/* Body */}
          <path
            d="M55 35 L40 70 L65 70 Z"
            fill="var(--tx-seeker)"
            stroke="var(--tx-ink)"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Arms */}
          <path
            d="M50 45 L30 55"
            fill="none"
            stroke="var(--tx-ink)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M50 45 L75 50"
            fill="none"
            stroke="var(--tx-ink)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Legs */}
          <g
            style={{
              animation: "leg-left 0.4s infinite",
              transformOrigin: "45px 70px",
            }}
          >
            <path
              d="M45 70 L35 90 L50 90"
              fill="none"
              stroke="var(--tx-ink)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
          <g
            style={{
              animation: "leg-right 0.4s infinite",
              transformOrigin: "55px 70px",
            }}
          >
            <path
              d="M55 70 L65 90 L80 90"
              fill="none"
              stroke="var(--tx-ink)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "4px",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          TRANSMITTING SIGNAL
        </p>
        <div
          className="tx-carrier-wave"
          style={{
            width: "140px",
            height: "2px",
            background: "var(--tx-ink)",
          }}
        />
        <p
          style={{
            fontSize: "10px",
            color: "var(--tx-ink-muted)",
            letterSpacing: "1px",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          Running to your destination...
        </p>
      </div>
    </div>
  );
};
