"use client";

import React from "react";
import Image from "next/image";
import {
  MapPin,
  Building2,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
} from "lucide-react";
import type { Job } from "@/types";

interface JobCardProps {
  job: Job;
  saved: boolean;
  onToggleSave: () => void;
}

const formatPostedDate = (dateString?: string) => {
  if (!dateString) return "Recently posted";

  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
};

const JobCardComponent: React.FC<JobCardProps> = ({
  job,
  saved,
  onToggleSave,
}) => {
  return (
    <div className="group border border-border bg-card rounded-xl p-6 hover:shadow-md transition-all duration-200 hover:border-primary/30 h-[320px] flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {job.company.logo ? (
            <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted border">
              <Image
                src={job.company.logo}
                alt={job.company.name}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted border flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-base leading-tight mb-1 line-clamp-2 group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {job.company.name}
            </p>
          </div>
        </div>

        <button
          onClick={onToggleSave}
          className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
        >
          {saved ? (
            <BookmarkCheck className="w-5 h-5 text-primary" />
          ) : (
            <Bookmark className="w-5 h-5 text-muted-foreground hover:text-foreground" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3 mb-4">
        {/* Location & Type */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{job.location}</span>
          {job.workType && (
            <>
              <span>•</span>
              <span className="capitalize">{job.workType.toLowerCase()}</span>
            </>
          )}
        </div>

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 3).map((skill) => (
              <span
                key={skill.id}
                className="inline-block px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-md"
              >
                {skill.name}
              </span>
            ))}
            {job.skills.length > 3 && (
              <span className="inline-block px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-md">
                +{job.skills.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {job.description.replace(/<[^>]*>/g, "").substring(0, 120)}...
          </p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 mt-auto border-t border-border">
        <span className="text-xs text-muted-foreground">
          {formatPostedDate(job.postedDate)}
        </span>

        <div className="flex gap-2">
          <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted hover:bg-accent rounded-lg transition-colors">
            View
          </button>
          <a
            href={job.applyUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors inline-flex items-center gap-1"
          >
            Apply
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export const JobCard = React.memo(JobCardComponent);
