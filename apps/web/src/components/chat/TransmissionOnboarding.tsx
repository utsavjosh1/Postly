import { useState } from "react";
import "../../styles/transmission.css";

/**
 * TransmissionOnboarding
 * ──────────────────────
 * Right-side slide-in panel with role-specific prompts.
 * Brutalist checkboxes fill via clip-path wipe.
 * Panel slides in with mechanical overshoot bounce.
 */

type Role = "seeker" | "recruiter";

interface OnboardingItem {
  id: string;
  label: string;
  hint: string;
}

const SEEKER_ITEMS: OnboardingItem[] = [
  {
    id: "stack",
    label: "Tech Stack",
    hint: "e.g. React, Node.js, Python, AWS",
  },
  {
    id: "experience",
    label: "Years of Experience",
    hint: "e.g. 3 years, Senior level",
  },
  {
    id: "preference",
    label: "Remote / Onsite Preference",
    hint: "Remote, Hybrid, or Onsite",
  },
  {
    id: "job-type",
    label: "Job Type",
    hint: "Full-time, Contract, Freelance",
  },
  {
    id: "salary",
    label: "Expected Compensation",
    hint: "e.g. $120k–$160k, Equity preferred",
  },
];

const RECRUITER_ITEMS: OnboardingItem[] = [
  {
    id: "role-title",
    label: "Open Role",
    hint: "e.g. Senior Frontend Engineer",
  },
  {
    id: "seniority",
    label: "Seniority Level",
    hint: "Junior, Mid, Senior, Staff, Principal",
  },
  {
    id: "tech-reqs",
    label: "Technical Requirements",
    hint: "e.g. TypeScript, React, System Design",
  },
  {
    id: "culture",
    label: "Culture Fit",
    hint: "e.g. Fast-paced, Collaborative, Remote-first",
  },
  {
    id: "comp-range",
    label: "Compensation Range",
    hint: "e.g. $130k–$180k + equity",
  },
];

interface TransmissionOnboardingProps {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
  onSubmitPrompt: (prompt: string) => void;
}

export function TransmissionOnboarding({
  role,
  isOpen,
  onClose,
  onSubmitPrompt,
}: TransmissionOnboardingProps) {
  const items = role === "seeker" ? SEEKER_ITEMS : RECRUITER_ITEMS;
  const accentColor =
    role === "seeker" ? "var(--tx-seeker)" : "var(--tx-recruiter)";
  const [values, setValues] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const handleValueChange = (id: string, value: string) => {
    setValues((prev) => ({ ...prev, [id]: value }));
    if (value.trim()) {
      setChecked((prev) => ({ ...prev, [id]: true }));
    } else {
      setChecked((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleGenerate = () => {
    const filledItems = items
      .filter((item) => values[item.id]?.trim())
      .map((item) => `${item.label}: ${values[item.id]?.trim()}`);

    if (filledItems.length === 0) return;

    const roleLabel = role === "seeker" ? "job seeker" : "recruiter";
    const prompt = `I'm a ${roleLabel}. Here's my profile:\n\n${filledItems.join("\n")}\n\nHelp me ${role === "seeker" ? "find the right opportunities and refine my job search" : "find the right candidates and refine my requirements"}.`;

    onSubmitPrompt(prompt);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.4)",
          zIndex: 90,
        }}
      />

      {/* Panel */}
      <div
        className="tx-panel-slide tx-scrollbar"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(420px, 90vw)",
          background: "var(--tx-surface)",
          borderLeft: "2px solid var(--tx-border)",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 24px 20px",
            borderBottom: "2px solid var(--tx-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: accentColor,
                marginBottom: "4px",
              }}
            >
              {role === "seeker"
                ? "TRANSMISSION // SEEKER"
                : "TRANSMISSION // RECRUITER"}
            </div>
            <h2
              style={{
                fontFamily: "var(--tx-font-display)",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--tx-ink)",
                margin: 0,
              }}
            >
              {role === "seeker" ? "Tell us about you" : "Define your role"}
            </h2>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              width: "36px",
              height: "36px",
              border: "2px solid var(--tx-border)",
              borderRadius: "var(--tx-radius)",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "var(--tx-font-mono)",
              fontSize: "16px",
              color: "var(--tx-ink)",
              transition: "background-color 150ms var(--tx-ease-sharp)",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--tx-ink)";
              e.currentTarget.style.color = "var(--tx-surface)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "var(--tx-ink)";
            }}
          >
            ✕
          </button>
        </div>

        {/* Items */}
        <div
          className="tx-scrollbar"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
          }}
        >
          {items.map((item, idx) => (
            <div
              key={item.id}
              style={{
                marginBottom: idx < items.length - 1 ? "20px" : 0,
              }}
            >
              {/* Label row with brutalist checkbox */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "8px",
                }}
              >
                {/* Checkbox */}
                <div
                  className={checked[item.id] ? "tx-checkbox-checked" : ""}
                  style={{
                    width: "18px",
                    height: "18px",
                    border: "2px solid var(--tx-border)",
                    borderRadius: "var(--tx-radius)",
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  <div
                    className="tx-checkbox-fill"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: accentColor,
                    }}
                  />
                </div>

                {/* Label */}
                <label
                  style={{
                    fontFamily: "var(--tx-font-mono)",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--tx-ink)",
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </label>
              </div>

              {/* Input */}
              <input
                className={`tx-input ${role === "recruiter" ? "tx-input-recruiter" : ""}`}
                type="text"
                placeholder={item.hint}
                value={values[item.id] || ""}
                onChange={(e) => handleValueChange(item.id, e.target.value)}
                style={{ width: "100%", boxSizing: "border-box" }}
              />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "20px 24px",
            borderTop: "2px solid var(--tx-border)",
            flexShrink: 0,
          }}
        >
          <button
            className={`tx-btn ${role === "seeker" ? "tx-btn-seeker" : "tx-btn-recruiter"}`}
            onClick={handleGenerate}
            style={{
              width: "100%",
              fontFamily: "var(--tx-font-mono)",
              fontSize: "13px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              padding: "14px 20px",
            }}
          >
            {role === "seeker" ? "→ TRANSMIT PROFILE" : "→ BROADCAST ROLE"}
          </button>

          <p
            style={{
              fontFamily: "var(--tx-font-mono)",
              fontSize: "10px",
              color: "var(--tx-ink-muted)",
              textAlign: "center",
              marginTop: "12px",
              letterSpacing: "1px",
            }}
          >
            Fill what you can. The AI will ask for more.
          </p>
        </div>
      </div>
    </>
  );
}
