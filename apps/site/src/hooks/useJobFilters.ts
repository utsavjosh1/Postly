import { useState, useEffect, useMemo } from 'react';
import { localStorage, toggleArrayItem } from '@/lib/utils';
import { MOCK_JOBS } from '@/constants';

export function useJobFilters() {
  const [query, setQuery] = useState('');
  const [stackFilter, setStackFilter] = useState<string[]>([]);
  const [seniorityFilter, setSeniorityFilter] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<string[]>([]);
  const [savedJobs, setSavedJobs] = useState<number[]>(() => 
    localStorage.get('savedJobs', [] as number[])
  );
  const [sortAscending, setSortAscending] = useState(true);

  useEffect(() => {
    localStorage.set('savedJobs', savedJobs);
  }, [savedJobs]);

  const toggleFilter = (
    currentFilter: string[], 
    value: string, 
    setter: (filter: string[]) => void
  ) => {
    setter(toggleArrayItem(currentFilter, value));
  };

  const filteredJobs = useMemo(() => {
    const jobs = MOCK_JOBS.filter(job => {
      const matchesQuery = !query.trim() || 
        job.title.toLowerCase().includes(query.toLowerCase()) ||
        job.company.toLowerCase().includes(query.toLowerCase()) ||
        job.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesStack = stackFilter.length === 0 || 
        stackFilter.some(filter => job.tags.includes(filter));

      const matchesLocation = locationFilter.length === 0 || 
        locationFilter.includes(job.loc);

      return matchesQuery && matchesStack && matchesLocation;
    });

    return jobs.sort((a, b) => 
      sortAscending 
        ? a.company.localeCompare(b.company)
        : b.company.localeCompare(a.company)
    );
  }, [query, stackFilter, locationFilter, sortAscending]);

  const toggleSavedJob = (jobId: number) => {
    setSavedJobs(prev => toggleArrayItem(prev, jobId));
  };

  return {
    query,
    setQuery,
    stackFilter,
    seniorityFilter,
    locationFilter,
    savedJobs,
    sortAscending,
    setSortAscending,
    filteredJobs,
    toggleStackFilter: (value: string) => toggleFilter(stackFilter, value, setStackFilter),
    toggleSeniorityFilter: (value: string) => toggleFilter(seniorityFilter, value, setSeniorityFilter),
    toggleLocationFilter: (value: string) => toggleFilter(locationFilter, value, setLocationFilter),
    toggleSavedJob,
    appliedFilters: [...stackFilter, ...seniorityFilter, ...locationFilter]
  };
}
