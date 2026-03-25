import { useState } from "react";
import {
  MapPin,
  Building2,
  Clock,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Wifi,
} from "lucide-react";
import type { OptimizedJobMatch } from "@postly/shared-types";
import { MatchScore } from "./MatchScore";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

interface JobCardProps {
  job: OptimizedJobMatch;
  isSaved?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
  variant?: "default" | "chat";
  onApply?: (id: string) => void;
}

export function JobCard({
  job,
  isSaved = false,
  onSave,
  onUnsave,
  onClick,
  isSelected,
  variant = "default",
  onApply,
}: JobCardProps) {
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saving) return;

    setSaving(true);
    try {
      if (isSaved) {
        await onUnsave?.();
      } else {
        await onSave?.();
      }
    } finally {
      setSaving(false);
    }
  };

  const { display_info, matching_data, meta } = job;
  const isChat = variant === "chat";

  if (isChat) {
    return (
      <div
        onClick={onClick}
        style={{
          width: "280px",
          minWidth: "280px",
          display: "flex",
          flexDirection: "column",
          background: "var(--tx-bg)",
          border: "2px solid var(--tx-border)",
          borderRadius: "var(--tx-radius)",
          cursor: "pointer",
          position: "relative",
          transition:
            "transform 150ms var(--tx-ease-sharp), box-shadow 150ms var(--tx-ease-sharp)",
          boxShadow: "4px 4px 0 var(--tx-border)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translate(-2px, -2px)";
          e.currentTarget.style.boxShadow = "6px 6px 0 var(--tx-border)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translate(0, 0)";
          e.currentTarget.style.boxShadow = "4px 4px 0 var(--tx-border)";
        }}
      >
        {/* Match Score */}
        {matching_data.match_score > 0 && (
          <div
            style={{
              position: "absolute",
              top: "-2px",
              right: "-2px",
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: "var(--tx-seeker)",
                color: "white",
                border: "2px solid var(--tx-border)",
                padding: "4px 8px",
                fontFamily: "var(--tx-font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "1px",
              }}
            >
              {matching_data.match_score}% MATCH
            </div>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <h3
            style={{
              fontFamily: "var(--tx-font-display)",
              fontWeight: 700,
              fontSize: "18px",
              color: "var(--tx-ink)",
              marginBottom: "6px",
              lineHeight: 1.2,
              paddingRight: "80px", // give space for match score
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {display_info.title}
          </h3>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "var(--tx-font-mono)",
              fontSize: "12px",
              color: "var(--tx-ink-muted)",
              marginBottom: "16px",
            }}
          >
            <Building2 style={{ width: "14px", height: "14px" }} />
            <span
              style={{
                fontWeight: 600,
                textTransform: "uppercase",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {display_info.company}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              fontFamily: "var(--tx-font-mono)",
              fontSize: "11px",
              color: "var(--tx-ink)",
              marginBottom: "16px",
            }}
          >
            {display_info.location && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  border: "1px solid var(--tx-border)",
                  padding: "2px 8px",
                  background: "var(--tx-surface)",
                }}
              >
                <MapPin style={{ width: "12px", height: "12px" }} />
                <span
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "120px",
                    fontWeight: 500,
                  }}
                >
                  {display_info.location}
                </span>
              </span>
            )}
            {meta.salary_range && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  border: "1px solid var(--tx-border)",
                  background: "var(--tx-surface)",
                  padding: "2px 8px",
                  fontWeight: 600,
                }}
              >
                {meta.salary_range}
              </span>
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "6px",
              marginTop: "auto",
              marginBottom: "4px",
            }}
          >
            {matching_data.key_skills?.slice(0, 3).map((skill) => (
              <span
                key={skill}
                style={{
                  background: "var(--tx-ink)",
                  color: "var(--tx-surface)",
                  padding: "2px 8px",
                  fontFamily: "var(--tx-font-mono)",
                  fontSize: "10px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {skill}
              </span>
            ))}
            {matching_data.key_skills &&
              matching_data.key_skills.length > 3 && (
                <span
                  style={{
                    border: "1px solid var(--tx-ink)",
                    color: "var(--tx-ink)",
                    padding: "2px 8px",
                    fontFamily: "var(--tx-font-mono)",
                    fontSize: "10px",
                    fontWeight: 600,
                  }}
                >
                  +{matching_data.key_skills.length - 3}
                </span>
              )}
          </div>
        </div>

        {/* Footer actions */}
        <div
          style={{
            borderTop: "2px solid var(--tx-border)",
            padding: "12px",
            background: "var(--tx-surface)",
          }}
        >
          <button
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              if (onApply) onApply(job.id);
              else if (meta.apply_url)
                window.open(meta.apply_url, "_blank", "noopener,noreferrer");
            }}
            style={{
              width: "100%",
              fontFamily: "var(--tx-font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--tx-surface)",
              background: "var(--tx-ink)",
              border: "2px solid var(--tx-border)",
              padding: "10px",
              cursor: "pointer",
              letterSpacing: "1px",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition:
                "transform 100ms var(--tx-ease-sharp), background-color 150ms var(--tx-ease-sharp)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--tx-seeker)")
            }
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--tx-ink)";
              e.currentTarget.style.transform = "scaleX(1)";
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scaleX(0.96)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scaleX(1)")}
          >
            VIEW & APPLY
            <ExternalLink style={{ width: "14px", height: "14px" }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "group bg-card border border-border rounded-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col p-4 hover:shadow-md hover:border-primary/30",
        isSelected && "ring-2 ring-primary border-primary",
      )}
    >
      <div className="flex gap-4">
        {/* Match Score */}
        {matching_data.match_score > 0 && (
          <div className="shrink-0">
            <MatchScore
              score={matching_data.match_score}
              size="sm"
              showLabel={false}
            />
          </div>
        )}

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">
                {display_info.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Building2 className="w-4 h-4" />
                <span>{display_info.company}</span>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                "p-2 rounded-lg transition-colors",
                isSaved
                  ? "text-primary hover:bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
              title={isSaved ? "Unsave job" : "Save job"}
            >
              {isSaved ? (
                <BookmarkCheck className="w-5 h-5" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Location & Job Type */}
          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
            {display_info.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">
                  {display_info.location}
                </span>
              </span>
            )}
            {meta.remote && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Wifi className="w-4 h-4" />
                Remote
              </span>
            )}
            {meta.salary_range && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                {meta.salary_range}
              </span>
            )}
          </div>

          {/* Skills */}
          {matching_data.key_skills && matching_data.key_skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {matching_data.key_skills.slice(0, 4).map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground border-transparent"
                >
                  {skill}
                </span>
              ))}
              {matching_data.key_skills.length > 4 && (
                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-transparent text-muted-foreground border-border">
                  +{matching_data.key_skills.length - 4}
                </span>
              )}
            </div>
          )}

          {/* AI Explanation */}
          {matching_data.ai_explanation && (
            <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 line-clamp-2">
              {matching_data.ai_explanation}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            {meta.apply_url && (
              <button
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  window.open(meta.apply_url, "_blank", "noopener,noreferrer");
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Apply
              </button>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {meta.posted_at
                ? new Date(meta.posted_at).toLocaleDateString()
                : "Recently posted"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
