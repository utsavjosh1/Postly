import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Filter, RefreshCw, Sparkles } from 'lucide-react';
import { JobCard } from '../components/jobs/JobCard';
import { ResumeSelector } from '../components/chat/ResumeSelector';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { useJobStore } from '../stores/job.store';
import { useResumeStore } from '../stores/resume.store';
import { jobService } from '../services/job.service';
import { authService } from '../services/auth.service';

export function JobsPage() {
  const navigate = useNavigate();
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const {
    jobs,
    matches,
    savedJobIds,
    isLoading,
    isMatchLoading,
    filters,
    setJobs,
    setMatches,
    setFilters,
    clearFilters,
    saveJob,
    unsaveJob,
    setLoading,
    setMatchLoading,
  } = useJobStore();

  // Resume store used for potential future features
  useResumeStore();

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/login');
      return;
    }

    loadJobs();
  }, [navigate, filters]);

  useEffect(() => {
    if (selectedResumeId) {
      loadMatches(selectedResumeId);
    }
  }, [selectedResumeId]);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const data = await jobService.getJobs(filters);
      setJobs(data.jobs, data.total);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async (resumeId: string) => {
    setMatchLoading(true);
    try {
      const data = await jobService.getMatches(resumeId, true, 20);
      setMatches(data);
    } catch (error) {
      console.error('Failed to load matches:', error);
    } finally {
      setMatchLoading(false);
    }
  };

  const handleSaveJob = async (jobId: string, matchScore = 0, explanation?: string) => {
    if (!selectedResumeId) return;
    try {
      await jobService.saveJob(jobId, selectedResumeId, matchScore, explanation);
      saveJob(jobId);
    } catch (error) {
      console.error('Failed to save job:', error);
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      await jobService.unsaveJob(jobId);
      unsaveJob(jobId);
    } catch (error) {
      console.error('Failed to unsave job:', error);
    }
  };

  const handleResumeChange = (resumeId: string | undefined) => {
    setSelectedResumeId(resumeId);
    if (!resumeId) {
      setMatches([]);
    }
  };

  const displayJobs = selectedResumeId ? matches : jobs;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Job Matches</h1>
                <p className="text-sm text-muted-foreground">
                  {selectedResumeId
                    ? `${matches.length} jobs matched to your resume`
                    : `${jobs.length} active jobs`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ResumeSelector
                value={selectedResumeId}
                onChange={handleResumeChange}
                className="w-64"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (selectedResumeId ? loadMatches(selectedResumeId) : loadJobs())}
                disabled={isLoading || isMatchLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading || isMatchLoading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg space-y-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.remote === true}
                    onChange={(e) =>
                      setFilters({ remote: e.target.checked ? true : undefined })
                    }
                    className="rounded border-border"
                  />
                  <span className="text-sm">Remote only</span>
                </label>

                <select
                  value={filters.job_type || ''}
                  onChange={(e) =>
                    setFilters({ job_type: e.target.value || undefined } as Parameters<typeof setFilters>[0])
                  }
                  className="px-3 py-1.5 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="">All job types</option>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>

                <Input
                  placeholder="Location..."
                  value={filters.location || ''}
                  onChange={(e) => setFilters({ location: e.target.value || undefined })}
                  className="w-48"
                />

                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              </div>

              {(filters.remote || filters.job_type || filters.location) && (
                <div className="flex gap-2">
                  {filters.remote && (
                    <Badge variant="secondary">
                      Remote
                      <button
                        onClick={() => setFilters({ remote: undefined })}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.job_type && (
                    <Badge variant="secondary">
                      {filters.job_type}
                      <button
                        onClick={() => setFilters({ job_type: undefined } as Parameters<typeof setFilters>[0])}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                  {filters.location && (
                    <Badge variant="secondary">
                      {filters.location}
                      <button
                        onClick={() => setFilters({ location: undefined })}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* AI Matching Banner */}
        {!selectedResumeId && (
          <div className="mb-6 p-4 bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-medium text-foreground">Get AI-Powered Job Matches</h3>
                <p className="text-sm text-muted-foreground">
                  Select a resume above to see jobs ranked by how well they match your skills and
                  experience.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Job List */}
        {isLoading || isMatchLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4">
                <div className="flex gap-4">
                  <Skeleton className="w-14 h-14 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayJobs.length > 0 ? (
          <div className="space-y-4">
            {displayJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={savedJobIds.has(job.id)}
                onSave={() =>
                  handleSaveJob(
                    job.id,
                    'match_score' in job ? (job.match_score as number) : 0,
                    'ai_explanation' in job ? (job.ai_explanation as string | undefined) : undefined
                  )
                }
                onUnsave={() => handleUnsaveJob(job.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No jobs found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedResumeId
                ? 'No jobs match your resume yet. Check back later!'
                : 'Try adjusting your filters or check back later.'}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
