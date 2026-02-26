import type { Job, OptimizedJobMatch, JobSource } from "@postly/shared-types";

interface MatchedJob extends Job {
  match_score?: number;
  ai_explanation?: string;
}

/**
 * Transform a raw Job (or MatchedJob) into OptimizedJobMatch format for UI consumption
 * Handles both legacy job objects and already optimized structures
 */
export function toOptimizedJobMatch(
  job: MatchedJob | OptimizedJobMatch,
): OptimizedJobMatch {
  if ("display_info" in job) {
    return job as OptimizedJobMatch;
  }

  const matachedJob = job as MatchedJob;

  const formatSalary = (min?: number, max?: number): string | undefined => {
    if (!min && !max) return undefined;
    if (min && max)
      return `$${(min / 1000).toFixed(0)}k - $${(max / 1000).toFixed(0)}k`;
    if (min) return `$${(min / 1000).toFixed(0)}k+`;
    return `Up to $${(max! / 1000).toFixed(0)}k`;
  };

  return {
    id: matachedJob.id,
    display_info: {
      title: matachedJob.title,
      company: matachedJob.company_name,
      location: matachedJob.location || "Remote",
      logo_url: undefined,
      source: matachedJob.source as JobSource,
    },
    matching_data: {
      match_score: matachedJob.match_score ?? 0,
      ai_explanation: matachedJob.ai_explanation,
      key_skills: matachedJob.skills_required || [],
    },
    meta: {
      posted_at:
        matachedJob.posted_at?.toISOString?.() ??
        (typeof matachedJob.posted_at === "string"
          ? matachedJob.posted_at
          : undefined),
      apply_url: matachedJob.source_url,
      remote: matachedJob.remote,
      salary_range: formatSalary(
        matachedJob.salary_min,
        matachedJob.salary_max,
      ),
    },
  };
}
