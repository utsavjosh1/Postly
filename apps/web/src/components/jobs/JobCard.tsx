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
import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { MatchScore } from "./MatchScore";

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

  return (
    <div
      onClick={onClick}
      className={cn(
        "group bg-card border border-border rounded-xl transition-all duration-200 cursor-pointer overflow-hidden flex flex-col",
        isChat
          ? "w-[280px] min-w-[280px] bg-zinc-900/50 border-white/10 hover:border-white/20"
          : "p-4 hover:shadow-md hover:border-primary/30",
        isSelected && "ring-2 ring-primary border-primary",
      )}
    >
      <div className={cn("flex gap-4", isChat && "flex-col gap-0 h-full")}>
        {/* Match Score */}
        {matching_data.match_score > 0 && (
          <div
            className={cn(
              "flex-shrink-0",
              isChat && "absolute top-3 right-3 z-10",
            )}
          >
            <MatchScore
              score={matching_data.match_score}
              size="sm"
              showLabel={false}
            />
          </div>
        )}

        {/* Job Info */}
        <div className={cn("flex-1 min-w-0", isChat && "flex flex-col h-full")}>
          <div
            className={cn(
              "flex items-start justify-between gap-2",
              isChat && "p-4 pb-0 block",
            )}
          >
            <div>
              <h3
                className={cn(
                  "font-semibold text-foreground line-clamp-1",
                  isChat && "text-white",
                )}
              >
                {display_info.title}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Building2 className="w-4 h-4" />
                <span>{display_info.company}</span>
              </div>
            </div>

            {/* Save button - Hide in chat for now or style differently */}
            {!isChat && (
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
            )}
          </div>

          {/* Location & Job Type */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground",
              isChat && "px-4 mt-2 mb-2",
            )}
          >
            {display_info.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[100px]">
                  {display_info.location}
                </span>
              </span>
            )}
            {/* Show remote badge */}
            {!isChat && meta.remote && (
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

          {/* Skills - Only show first 3 in chat */}
          {matching_data.key_skills && matching_data.key_skills.length > 0 && (
            <div
              className={cn(
                "flex flex-wrap gap-1.5 mt-3",
                isChat && "px-4 mt-auto mb-3 min-h-[24px]",
              )}
            >
              {matching_data.key_skills
                .slice(0, isChat ? 3 : 4)
                .map((skill) => (
                  <Badge
                    key={skill}
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      isChat &&
                        "bg-white/5 text-zinc-400 border-white/5 px-1.5 py-0",
                    )}
                  >
                    {skill}
                  </Badge>
                ))}
              {matching_data.key_skills.length > (isChat ? 3 : 4) && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    isChat &&
                      "bg-white/5 text-zinc-500 border-white/5 px-1.5 py-0",
                  )}
                >
                  +{matching_data.key_skills.length - (isChat ? 3 : 4)}
                </Badge>
              )}
            </div>
          )}

          {/* AI Explanation */}
          {!isChat && matching_data.ai_explanation && (
            <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 line-clamp-2">
              {matching_data.ai_explanation}
            </p>
          )}

          {/* Actions */}
          <div
            className={cn(
              "flex items-center gap-2 mt-4",
              isChat && "mt-3 p-4 border-t border-white/5 bg-white/5",
            )}
          >
            {isChat ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onApply) onApply(job.id);
                  else if (meta.apply_url)
                    window.open(
                      meta.apply_url,
                      "_blank",
                      "noopener,noreferrer",
                    );
                }}
                className="w-full py-1.5 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-xs"
              >
                View & Apply
                <ExternalLink className="w-3 h-3" />
              </button>
            ) : (
              <>
                {meta.apply_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(
                        meta.apply_url,
                        "_blank",
                        "noopener,noreferrer",
                      );
                    }}
                    className="gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Apply
                  </Button>
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {meta.posted_at
                    ? new Date(meta.posted_at).toLocaleDateString()
                    : "Recently posted"}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
