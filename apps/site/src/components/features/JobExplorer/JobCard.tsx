'use client';

import React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { Job } from '@/types';

interface JobCardProps {
  job: Job;
  saved: boolean;
  onToggleSave: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, saved, onToggleSave }) => {
  return (
    <div className="rounded-xl border border-border bg-popover p-4 hover:bg-white/[0.06] transition group">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{job.company}</div>
        <button 
          onClick={onToggleSave} 
          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border hover:bg-white/5" 
          aria-label="Save role"
        >
          {saved ? (
            <BookmarkCheck className="w-4 h-4 text-primary" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>
      
      <div className="mt-1 font-medium">{job.title}</div>
      <div className="mt-1 text-xs text-muted-foreground">
        Comp: {job.comp} • {job.loc}
      </div>
      
      <div className="mt-2 flex flex-wrap gap-2">
        {job.tags.map(tag => (
          <span 
            key={tag} 
            className="text-xs rounded-md bg-secondary px-2 py-1 border border-border"
          >
            {tag}
          </span>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground">
        Impact: {job.impact}
      </div>
      
      <div className="mt-3 flex items-center gap-2">
        <button className="h-9 px-3 rounded-md border border-border text-xs hover:bg-white/5">
          Quick Match
        </button>
        <button className="h-9 px-3 rounded-md text-xs bg-white/10 border border-white/20">
          Apply
        </button>
      </div>
    </div>
  );
};
