import { useState } from 'react';
import {
  MapPin,
  Building2,
  Clock,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Briefcase,
  Wifi,
} from 'lucide-react';
import type { Job } from '@postly/shared-types';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MatchScore } from './MatchScore';

interface MatchedJob extends Job {
  match_score?: number;
  ai_explanation?: string;
}

interface JobCardProps {
  job: MatchedJob;
  isSaved?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  onClick?: () => void;
  isSelected?: boolean;
}

export function JobCard({
  job,
  isSaved = false,
  onSave,
  onUnsave,
  onClick,
  isSelected,
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

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return null;
    const format = (n: number) => `$${Math.round(n / 1000)}k`;
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `${format(min)}+`;
    return `Up to ${format(max!)}`;
  };

  const salary = formatSalary(job.salary_min, job.salary_max);

  return (
    <div
      onClick={onClick}
      className={cn(
        'group bg-card border border-border rounded-xl p-4 transition-all duration-200 cursor-pointer',
        'hover:shadow-md hover:border-primary/30',
        isSelected && 'ring-2 ring-primary border-primary'
      )}
    >
      <div className="flex gap-4">
        {/* Match Score */}
        {job.match_score !== undefined && (
          <div className="flex-shrink-0">
            <MatchScore score={job.match_score} size="sm" showLabel={false} />
          </div>
        )}

        {/* Job Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">{job.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <Building2 className="w-4 h-4" />
                <span>{job.company_name}</span>
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={cn(
                'p-2 rounded-lg transition-colors',
                isSaved
                  ? 'text-primary hover:bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
              title={isSaved ? 'Unsave job' : 'Save job'}
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
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
            )}
            {job.remote && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Wifi className="w-4 h-4" />
                Remote
              </span>
            )}
            {job.job_type && (
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {job.job_type.replace('-', ' ')}
              </span>
            )}
            {salary && (
              <span className="flex items-center gap-1 font-medium text-foreground">
                {salary}
              </span>
            )}
          </div>

          {/* Skills */}
          {job.skills_required && job.skills_required.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills_required.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {job.skills_required.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{job.skills_required.length - 4}
                </Badge>
              )}
            </div>
          )}

          {/* AI Explanation */}
          {job.ai_explanation && (
            <p className="mt-3 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3 line-clamp-2">
              {job.ai_explanation}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            {job.source_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(job.source_url, '_blank', 'noopener,noreferrer');
                }}
                className="gap-1.5"
              >
                <ExternalLink className="w-4 h-4" />
                Apply
              </Button>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {job.posted_at
                ? new Date(job.posted_at).toLocaleDateString()
                : 'Recently posted'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
