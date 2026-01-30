import { useState } from "react";
import {
  FileText,
  Trash2,
  RefreshCw,
  Briefcase,
  GraduationCap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Resume } from "@postly/shared-types";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { resumeService } from "../../services/resume.service";
import { useResumeStore } from "../../stores/resume.store";

interface ResumeCardProps {
  resume: Resume;
  isActive?: boolean;
  onSelect?: () => void;
}

export function ResumeCard({ resume, isActive, onSelect }: ResumeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const { removeResume, updateResume } = useResumeStore();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await resumeService.deleteResume(resume.id);
      removeResume(resume.id);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Failed to delete resume:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    try {
      const updated = await resumeService.reanalyzeResume(resume.id);
      updateResume(updated);
    } catch (error) {
      console.error("Failed to reanalyze resume:", error);
    } finally {
      setIsReanalyzing(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const hasAnalysis = resume.skills && resume.skills.length > 0;

  return (
    <>
      <div
        className={cn(
          "group bg-card border border-border rounded-xl p-4 transition-all duration-200",
          "hover:shadow-md hover:border-primary/30",
          isActive && "ring-2 ring-primary border-primary",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={onSelect}
            className="flex items-start gap-3 flex-1 text-left"
          >
            <div
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                hasAnalysis ? "bg-primary/10" : "bg-muted",
              )}
            >
              <FileText
                className={cn(
                  "w-5 h-5",
                  hasAnalysis ? "text-primary" : "text-muted-foreground",
                )}
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground truncate">
                {resume.file_url.split("/").pop() || "Resume"}
              </h3>
              <p className="text-sm text-muted-foreground">
                Uploaded {formatDate(resume.created_at)}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing || !resume.parsed_text}
              className={cn(
                "p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              title="Re-analyze resume"
            >
              <RefreshCw
                className={cn("w-4 h-4", isReanalyzing && "animate-spin")}
              />
            </button>
            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Delete resume"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {hasAnalysis && (
          <>
            <div className="mt-4 space-y-3">
              {/* Experience & Education Summary */}
              <div className="flex items-center gap-4 text-sm">
                {resume.experience_years !== undefined && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Briefcase className="w-4 h-4" />
                    <span>{resume.experience_years} years exp.</span>
                  </div>
                )}
                {resume.education && resume.education.length > 0 && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <GraduationCap className="w-4 h-4" />
                    <span>
                      {resume.education.length} degree
                      {resume.education.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* Skills Preview */}
              {resume.skills && resume.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {resume.skills
                    .slice(0, isExpanded ? undefined : 5)
                    .map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  {!isExpanded && resume.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{resume.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              )}

              {/* Expand/Collapse Button */}
              {(resume.skills && resume.skills.length > 5) ||
              (resume.education && resume.education.length > 0) ? (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      Show more
                    </>
                  )}
                </button>
              ) : null}

              {/* Expanded Content */}
              {isExpanded &&
                resume.education &&
                resume.education.length > 0 && (
                  <div className="pt-2 border-t border-border space-y-2">
                    <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      Education
                    </h4>
                    {resume.education.map((edu, index) => (
                      <div
                        key={index}
                        className="text-sm text-muted-foreground pl-6"
                      >
                        <p className="font-medium text-foreground">
                          {edu.degree}
                        </p>
                        <p>
                          {edu.institution}
                          {edu.year && ` (${edu.year})`}
                        </p>
                        {edu.field_of_study && (
                          <p className="text-xs">{edu.field_of_study}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </>
        )}

        {!hasAnalysis && resume.parsed_text && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {resume.parsed_text.substring(0, 200)}...
          </p>
        )}

        {!hasAnalysis && !resume.parsed_text && (
          <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
            Processing... Analysis will appear shortly.
          </p>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resume</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this resume? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
