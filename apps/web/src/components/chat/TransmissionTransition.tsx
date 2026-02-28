import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/transmission.css";

/**
 * TransmissionTransition
 * ──────────────────────
 * Full-screen color overlay that expands from click point via clip-path: circle(),
 * then contracts to reveal the destination. 600ms total.
 * JS only toggles classes — all animation logic is in CSS.
 */

interface TransitionState {
  active: boolean;
  phase: "expand" | "contract" | "idle";
  color: string;
  x: string;
  y: string;
  destination: string;
}

export function useTransmissionTransition() {
  const [state, setState] = useState<TransitionState>({
    active: false,
    phase: "idle",
    color: "",
    x: "50%",
    y: "50%",
    destination: "",
  });
  const navigate = useNavigate();

  const trigger = useCallback(
    (role: "seeker" | "recruiter", clickX: number, clickY: number) => {
      const color =
        role === "seeker" ? "var(--tx-seeker)" : "var(--tx-recruiter)";
      const x = `${clickX}px`;
      const y = `${clickY}px`;
      const destination = `/chat?role=${role}`;

      // Phase 1: Expand
      setState({
        active: true,
        phase: "expand",
        color,
        x,
        y,
        destination,
      });

      // Phase 2: Contract after 300ms
      setTimeout(() => {
        setState((prev) => ({ ...prev, phase: "contract" }));
      }, 300);

      // Phase 3: Navigate and clean up after 600ms total
      setTimeout(() => {
        navigate(destination);
        setState({
          active: false,
          phase: "idle",
          color: "",
          x: "50%",
          y: "50%",
          destination: "",
        });
      }, 600);
    },
    [navigate],
  );

  return { state, trigger };
}

export function TransmissionTransition({ state }: { state: TransitionState }) {
  if (!state.active) return null;

  return (
    <div
      className={
        state.phase === "expand"
          ? "tx-transition-expand"
          : "tx-transition-contract"
      }
      style={
        {
          position: "fixed",
          inset: 0,
          zIndex: 9999,
          backgroundColor: state.color,
          // CSS custom properties for the clip-path animation
          "--tx-click-x": state.x,
          "--tx-click-y": state.y,
        } as React.CSSProperties
      }
    />
  );
}
