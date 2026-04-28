import { JobCard } from "../jobs/JobCard";
import { ChevronRight } from "lucide-react";
import type { OptimizedJobMatch } from "@postly/shared-types";

interface JobCarouselProps {
  message: string;
  data: OptimizedJobMatch[];
  suggested_actions?: string[];
  onApply?: (id: string) => void;
}
export function JobCarousel({
  message,
  data,
  suggested_actions,
  onApply,
}: JobCarouselProps) {
  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {message && (
        <p
          style={{
            fontFamily: "var(--tx-font-mono)",
            fontSize: "13px",
            color: "var(--tx-ink)",
          }}
        >
          {message}
        </p>
      )}

      {/* Scroll Container */}
      <div
        className="tx-scrollbar"
        style={{
          display: "flex",
          gap: "16px",
          overflowX: "auto",
          paddingBottom: "16px",
          scrollSnapType: "x mandatory",
          margin: "0 -20px",
          padding: "0 20px 16px 20px",
        }}
      >
        {data.map((job) => (
          <div
            key={job.id}
            style={{ scrollSnapAlign: "center", flexShrink: 0 }}
          >
            <JobCard job={job} onApply={onApply} variant="chat" />
          </div>
        ))}
      </div>

      {/* Actions */}
      {suggested_actions && suggested_actions.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {suggested_actions.map((action, i) => (
            <button
              key={i}
              style={{
                fontFamily: "var(--tx-font-mono)",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--tx-ink)",
                background: "transparent",
                border: "2px solid var(--tx-border)",
                borderRadius: "var(--tx-radius)",
                padding: "6px 12px",
                cursor: "pointer",
                letterSpacing: "1px",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition:
                  "background-color 150ms var(--tx-ease-sharp), color 150ms var(--tx-ease-sharp)",
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
              {action}
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
