import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, ArrowRight } from "lucide-react";
import { ResumeUpload } from "../components/resume/ResumeUpload";
import { ResumeCard } from "../components/resume/ResumeCard";
import { Skeleton } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { useResumeStore } from "../stores/resume.store";
import { resumeService } from "../services/resume.service";
import { authService } from "../services/auth.service";

export function ResumePage() {
  const navigate = useNavigate();
  const {
    resumes,
    activeResume,
    isLoading,
    setResumes,
    setActiveResume,
    setLoading,
  } = useResumeStore();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authService.isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Load resumes
    const loadResumes = async () => {
      setLoading(true);
      try {
        const data = await resumeService.getResumes();
        setResumes(data);
        if (data.length > 0 && !activeResume) {
          setActiveResume(data[0]);
        }
      } catch (error) {
        console.error("Failed to load resumes:", error);
      } finally {
        setLoading(false);
      }
    };

    loadResumes();
  }, [navigate, setResumes, setActiveResume, setLoading, activeResume]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground">
                  My Resumes
                </h1>
                <p className="text-sm text-muted-foreground">
                  Upload and manage your resumes
                </p>
              </div>
            </div>
            {activeResume && (
              <Button onClick={() => navigate("/chat")} className="gap-2">
                Start AI Chat
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Upload Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-medium text-foreground">
                Upload New Resume
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Our AI will analyze your resume and extract key information.
              </p>
            </div>
            <ResumeUpload />
          </div>

          {/* Resume List Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-foreground">
                  Your Resumes
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {resumes.length} resume{resumes.length !== 1 ? "s" : ""}{" "}
                  uploaded
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : resumes.length > 0 ? (
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <ResumeCard
                    key={resume.id}
                    resume={resume}
                    isActive={activeResume?.id === resume.id}
                    onSelect={() => setActiveResume(resume)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-muted/50 border border-dashed border-border rounded-xl p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground">
                  No resumes yet
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload your first resume to get started with AI-powered job
                  matching.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Active Resume Details */}
        {activeResume && activeResume.parsed_text && (
          <div className="mt-12 space-y-4">
            <h2 className="text-lg font-medium text-foreground">
              Resume Preview
            </h2>
            <div className="bg-card border border-border rounded-xl p-6">
              <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-mono overflow-auto max-h-96">
                {activeResume.parsed_text}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
