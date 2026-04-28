import { useEffect, useState } from "react";
import { useToastStore } from "../../stores/toast.store";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import "../../styles/transmission.css";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        top: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            pointerEvents: "auto",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            minWidth: "320px",
            maxWidth: "420px",
            padding: "16px 20px",
            background: "var(--tx-surface)",
            border: "2px solid var(--tx-border)",
            boxShadow: "6px 6px 0px var(--tx-ink)",
            fontFamily: "var(--tx-font-mono)",
            color: "var(--tx-ink)",
            animation: "panel-slide 300ms var(--tx-ease-mechanical) forwards",
          }}
        >
          <div
            style={{
              width: "4px",
              height: "24px",
              background:
                toast.type === "success"
                  ? "#00c853"
                  : toast.type === "error"
                    ? "var(--tx-seeker)"
                    : toast.type === "warning"
                      ? "#ffd600"
                      : "var(--tx-recruiter)",
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1 }}>
            <span
              style={{
                display: "block",
                fontSize: "9px",
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
                marginBottom: "2px",
                color: "var(--tx-ink-muted)",
              }}
            >
              {toast.type || "SIGNAL"}
            </span>
            <p
              style={{
                fontSize: "13px",
                margin: 0,
                lineHeight: "1.4",
              }}
            >
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: "4px",
              color: "var(--tx-ink-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "color 150ms var(--tx-ease-sharp)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--tx-ink)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--tx-ink-muted)")
            }
          >
            <X size={16} strokeWidth={3} />
          </button>
        </div>
      ))}
    </div>,
    document.body,
  );
}
