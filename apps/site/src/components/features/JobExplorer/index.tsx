"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  Map,
  MoveRight,
  SlidersHorizontal,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  X,
  Loader2,
  RefreshCw,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { cx } from "@/lib/utils";
import type { ViewMode, Job, JobStats } from "@/types";
import JobsAPI, { type JobsQueryParams } from "@/lib/api";
import { JobCard } from "./JobCard";
import { GraphView } from "./GraphView";
import { FilterMulti } from "./FilterMulti";

// Debounce hook for performance
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const WORK_TYPE_OPTIONS = ['REMOTE', 'ONSITE', 'HYBRID', 'FLEXIBLE'] as const;
const SENIORITY_OPTIONS = ['INTERN', 'ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'STAFF_LEVEL', 'PRINCIPAL_LEVEL'] as const;

interface Filters {
  search: string;
  workType: string[];
  seniorityLevel: string[];
  jobTypes: string[];
  location: string;
  skills: string[];
}

export const JobExplorer: React.FC = () => {
  const [view, setView] = useState<ViewMode>("grid");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    workType: [],
    seniorityLevel: [],
    jobTypes: [],
    location: '',
    skills: [],
  });
  
  // Debounce search and location inputs for better performance (reduced to 150ms)
  const debouncedSearch = useDebounce(filters.search, 150);
  const debouncedLocation = useDebounce(filters.location, 150);
  
  const [sortAscending, setSortAscending] = useState(true);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Load saved jobs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedJobs');
    if (saved) {
      setSavedJobs(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage when savedJobs changes
  useEffect(() => {
    localStorage.setItem('savedJobs', JSON.stringify(savedJobs));
  }, [savedJobs]);

  const fetchJobs = useCallback(async (params: JobsQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams: JobsQueryParams = {
        page: pagination.page,
        limit: pagination.limit,
        ...params,
      };

      // Add filters to query using debounced values for search and location
      if (debouncedSearch) queryParams.search = debouncedSearch;
      if (filters.workType.length) queryParams.workType = filters.workType[0]; // API expects single value
      if (filters.seniorityLevel.length) queryParams.seniorityLevel = filters.seniorityLevel[0];
      if (debouncedLocation) queryParams.location = debouncedLocation;
      if (filters.skills.length) queryParams.skills = filters.skills;

      const response = await JobsAPI.getJobs(queryParams);

      if (response.success) {
        setJobs(response.data);
        if (response.meta) {
          setPagination(response.meta);
        }
      } else {
        setError('Failed to fetch jobs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, debouncedLocation, filters.workType, filters.seniorityLevel, filters.skills, pagination.page, pagination.limit]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await JobsAPI.getJobStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch job stats:', err);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchJobs();
    fetchStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when debounced search/location or other filters change
  useEffect(() => {
    if (pagination.page === 1) {
      fetchJobs();
    } else {
      setPagination(prev => ({ ...prev, page: 1 }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, debouncedLocation, filters.workType, filters.seniorityLevel, filters.skills]);

  // Refetch when page changes
  useEffect(() => {
    if (pagination.page > 1) {
      fetchJobs();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page]);

  const handleFilterChange = <K extends keyof Filters>(
    key: K,
    value: Filters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleSavedJob = useCallback((jobId: string) => {
    setSavedJobs(prev => 
      prev.includes(jobId) 
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      search: '',
      workType: [],
      seniorityLevel: [],
      jobTypes: [],
      location: '',
      skills: [],
    });
  }, []);

  const activeFiltersCount = useMemo(() => 
    Object.values(filters).filter(value => 
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    ).length, [filters]
  );

  // Memoize job cards for better performance with sorting
  const jobCards = useMemo(() => {
    const sortedJobs = [...jobs];
    
    // Sort jobs by posted date or created date
    sortedJobs.sort((a, b) => {
      const dateA = new Date(a.postedDate || a.createdAt).getTime();
      const dateB = new Date(b.postedDate || b.createdAt).getTime();
      
      return sortAscending ? dateA - dateB : dateB - dateA;
    });
    
    return sortedJobs.map((job) => (
      <JobCard
        key={job.id}
        job={job}
        saved={savedJobs.includes(job.id)}
        onToggleSave={() => toggleSavedJob(job.id)}
      />
    ));
  }, [jobs, savedJobs, sortAscending, toggleSavedJob]);

  // Memoize the grid to prevent unnecessary re-renders
  const jobGrid = useMemo(() => (
    <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      {jobCards}
    </div>
  ), [jobCards]);

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Subtle background gradient matching other pages */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-16 lg:pt-28 lg:pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground leading-tight">
              Job Explorer
            </h1>
            <p className="mt-2 text-lg text-muted-foreground leading-relaxed">
              Discover {stats?.totalJobs || '1000+'} opportunities matched by skills and impact
            </p>
            {stats && (
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {stats.recentJobs} new this week
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile Filter Toggle */}
            <button
              className="sm:hidden rounded-lg border border-border bg-card/60 backdrop-blur-sm h-10 px-4 text-sm font-medium flex items-center gap-2 hover:bg-accent/50 transition-all duration-300"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* View Toggle */}
            <div className="flex items-center rounded-lg border border-border bg-card/60 backdrop-blur-sm p-1 shadow-sm">
              <button
                className={cx(
                  "h-8 px-3 rounded-md text-sm font-medium transition-all duration-200",
                  view === "grid" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                onClick={() => setView("grid")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                className={cx(
                  "h-8 px-3 rounded-md text-sm font-medium transition-all duration-200",
                  view === "graph" 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                onClick={() => setView("graph")}
              >
                <Map className="w-4 h-4" />
              </button>
            </div>

            <Link
              href="/upload"
              className="hidden sm:inline-flex rounded-lg h-10 px-6 bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 items-center gap-2 shadow-sm hover:shadow-md transition-all duration-300"
            >
              Upload Resume 
              <MoveRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Filters Sidebar */}
          <aside className={cx(
            "lg:block",
            showMobileFilters ? "block" : "hidden"
          )}>
            <div className="rounded-2xl border border-border/25 bg-card/60 backdrop-blur-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <SlidersHorizontal className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Filters</h3>
                  {activeFiltersCount > 0 && (
                    <span className="bg-primary/10 text-primary text-xs rounded-full px-2.5 py-1 font-medium">
                      {activeFiltersCount}
                    </span>
                  )}
                </div>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-3 block text-foreground">
                    Keywords
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="e.g. React, Frontend, Remote"
                      className="w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-background/60 backdrop-blur-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                    />
                    {filters.search && (
                      <button
                        onClick={() => handleFilterChange('search', '')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

              {/* Work Type */}
              <FilterMulti
                title="Work Type"
                options={WORK_TYPE_OPTIONS}
                values={filters.workType}
                onToggle={(value) => {
                  const newValues = filters.workType.includes(value)
                    ? filters.workType.filter(v => v !== value)
                    : [value]; // Single selection for API compatibility
                  handleFilterChange('workType', newValues);
                }}
              />

              {/* Seniority Level */}
              <FilterMulti
                title="Seniority Level"
                options={SENIORITY_OPTIONS}
                values={filters.seniorityLevel}
                onToggle={(value) => {
                  const newValues = filters.seniorityLevel.includes(value)
                    ? filters.seniorityLevel.filter(v => v !== value)
                    : [value]; // Single selection for API compatibility
                  handleFilterChange('seniorityLevel', newValues);
                }}
              />

                {/* Location */}
                <div>
                  <label className="text-sm font-medium mb-3 block text-foreground">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      value={filters.location}
                      onChange={(e) => handleFilterChange('location', e.target.value)}
                      placeholder="e.g. San Francisco, Remote"
                      className="w-full h-10 pl-10 pr-10 rounded-lg border border-input bg-background/60 backdrop-blur-sm text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200"
                    />
                    {filters.location && (
                      <button
                        onClick={() => handleFilterChange('location', '')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="rounded-2xl border border-border/25 bg-card/60 backdrop-blur-xl shadow-lg">
            {/* Results Header */}
            <div className="p-6 border-b border-border/25">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {loading ? 'Loading...' : `${pagination.total} Jobs Found`}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Page {pagination.page} of {pagination.totalPages}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fetchJobs()}
                    disabled={loading}
                    className="rounded-lg h-10 px-4 border border-border bg-background/60 backdrop-blur-sm text-sm font-medium hover:bg-accent/50 disabled:opacity-50 flex items-center gap-2 transition-all duration-300"
                  >
                    <RefreshCw className={cx("w-4 h-4", loading && "animate-spin")} />
                    Refresh
                  </button>
                  
                  <button
                    onClick={() => setSortAscending(!sortAscending)}
                    className="rounded-lg h-10 px-4 border border-border bg-background/60 backdrop-blur-sm text-sm font-medium hover:bg-accent/50 flex items-center gap-2 transition-all duration-300"
                    title={sortAscending ? "Sort by newest first" : "Sort by oldest first"}
                  >
                    {sortAscending ? (
                      <>
                        <SortAsc className="w-4 h-4" />
                        <span>Oldest</span>
                      </>
                    ) : (
                      <>
                        <SortDesc className="w-4 h-4" />
                        <span>Newest</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Finding opportunities...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-16">
                  <div className="text-red-500 mb-4 font-medium">Error: {error}</div>
                  <button
                    onClick={() => fetchJobs()}
                    className="text-sm text-primary hover:underline transition-colors duration-200"
                  >
                    Try again
                  </button>
                </div>
              ) : view === "grid" ? (
                <>
                  {jobGrid}
                  
                  {jobs.length === 0 && (
                    <div className="text-center py-16">
                      <div className="text-muted-foreground mb-4">
                        No jobs found matching your criteria
                      </div>
                      <button
                        onClick={clearAllFilters}
                        className="text-sm text-primary hover:underline transition-colors duration-200"
                      >
                        Clear filters
                      </button>
                    </div>
                  )}

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 pt-8 mt-8 border-t border-border/25">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={!pagination.hasPrev}
                        className="rounded-lg h-10 px-4 border border-border bg-background/60 backdrop-blur-sm text-sm font-medium hover:bg-accent/50 disabled:opacity-50 transition-all duration-300"
                      >
                        Previous
                      </button>
                      
                      <span className="text-sm text-muted-foreground px-4">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={!pagination.hasNext}
                        className="rounded-lg h-10 px-4 border border-border bg-background/60 backdrop-blur-sm text-sm font-medium hover:bg-accent/50 disabled:opacity-50 transition-all duration-300"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <GraphView />
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Overlay */}
        {showMobileFilters && (
          <div 
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          />
        )}
      </div>
    </section>
  );
};
