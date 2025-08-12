'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  LayoutGrid, Map, MoveRight, SlidersHorizontal, 
  Search, ChevronDown, SortAsc, SortDesc 
} from 'lucide-react';
import { useJobFilters } from '@/hooks/useJobFilters';
import { FILTER_OPTIONS } from '@/constants';
import { cx } from '@/lib/utils';
import type { ViewMode } from '@/types';
import { JobCard } from './JobCard';
import { GraphView } from './GraphView';
import { FilterMulti } from './FilterMulti';

export const JobExplorer: React.FC = () => {
  const [view, setView] = useState<ViewMode>('grid');
  const {
    query,
    setQuery,
    filteredJobs,
    savedJobs,
    sortAscending,
    setSortAscending,
    appliedFilters,
    toggleStackFilter,
    toggleSeniorityFilter,
    toggleLocationFilter,
    toggleSavedJob,
    stackFilter,
    seniorityFilter,
    locationFilter
  } = useJobFilters();

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-10 lg:py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Job Explorer</h1>
          <p className="text-muted-foreground">
            Find roles that match your skills and impact.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            className={cx(
              'h-10 px-3 rounded-md border border-border text-sm', 
              view === 'grid' && 'bg-white/10'
            )} 
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            className={cx(
              'h-10 px-3 rounded-md border border-border text-sm', 
              view === 'graph' && 'bg-white/10'
            )} 
            onClick={() => setView('graph')}
          >
            <Map className="w-4 h-4" />
          </button>
          <Link 
            href="/upload"
            className="h-10 px-3 rounded-md border border-border text-sm hidden sm:inline-flex items-center"
          >
            Upload Resume <MoveRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-[300px_1fr] gap-6">
        <aside className="rounded-2xl border border-border bg-white/[0.05] backdrop-blur-xl p-5 h-fit">
          <div className="flex items-center gap-2 text-primary">
            <SlidersHorizontal className="w-4 h-4" />
            <div className="text-sm font-medium">Filters</div>
          </div>

          <div className="mt-4 grid gap-4 text-sm">
            <div>
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground">Keywords</div>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="mt-2 flex items-center gap-2 rounded-md border border-border bg-black/20 px-2">
                <Search className="w-4 h-4 text-primary" />
                <input 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                  placeholder="e.g. streaming, react"
                  className="h-9 bg-transparent outline-none text-sm flex-1" 
                />
                <button 
                  onClick={() => setQuery('')} 
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
            </div>

            <FilterMulti 
              title="Stack" 
              options={FILTER_OPTIONS.stack} 
              values={stackFilter} 
              onToggle={toggleStackFilter} 
            />
            <FilterMulti 
              title="Seniority" 
              options={FILTER_OPTIONS.seniority} 
              values={seniorityFilter} 
              onToggle={toggleSeniorityFilter} 
            />
            <FilterMulti 
              title="Location" 
              options={FILTER_OPTIONS.location} 
              values={locationFilter} 
              onToggle={toggleLocationFilter} 
            />

            <div className="flex items-center justify-between">
              <div className="text-muted-foreground">Sort by company</div>
              <button 
                onClick={() => setSortAscending(prev => !prev)} 
                className="h-9 px-3 rounded-md border border-border text-xs hover:bg-white/5 inline-flex items-center gap-2"
              >
                {sortAscending ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                {sortAscending ? 'A→Z' : 'Z→A'}
              </button>
            </div>

            {appliedFilters.length > 0 && (
              <div className="pt-2 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">Applied filters</div>
                <div className="flex flex-wrap gap-2">
                  {appliedFilters.map(filter => (
                    <span 
                      key={filter} 
                      className="text-xs rounded-full border border-border bg-secondary px-3 py-1"
                    >
                      {filter}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="min-h-[420px] rounded-2xl border border-border bg-white/[0.05] backdrop-blur-xl p-5">
          {view === 'grid' ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  saved={savedJobs.includes(job.id)} 
                  onToggleSave={() => toggleSavedJob(job.id)}
                />
              ))}
              {filteredJobs.length === 0 && (
                <div className="col-span-full text-sm text-muted-foreground">
                  No results. Adjust filters or keywords.
                </div>
              )}
            </div>
          ) : (
            <GraphView />
          )}
        </div>
      </div>
    </section>
  );
};
