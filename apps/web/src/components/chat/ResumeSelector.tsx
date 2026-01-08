import { useEffect } from "react";
import { FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/Select";
import { useResumeStore } from "../../stores/resume.store";
import { resumeService } from "../../services/resume.service";

interface ResumeSelectorProps {
  value?: string;
  onChange: (resumeId: string | undefined) => void;
  className?: string;
}

export function ResumeSelector({
  value,
  onChange,
  className,
}: ResumeSelectorProps) {
  const { resumes, isLoading, setResumes, setLoading } = useResumeStore();

  useEffect(() => {
    const loadResumes = async () => {
      if (resumes.length === 0) {
        setLoading(true);
        try {
          const data = await resumeService.getResumes();
          setResumes(data);
        } catch (error) {
          console.error("Failed to load resumes:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadResumes();
  }, [resumes.length, setResumes, setLoading]);

  const selectedResume = resumes.find((r) => r.id === value);

  const getResumeLabel = (fileUrl: string) => {
    const filename = fileUrl.split("/").pop() || "Resume";
    return filename.length > 25 ? filename.substring(0, 22) + "..." : filename;
  };

  return (
    <Select value={value || ""} onValueChange={(v) => onChange(v || undefined)}>
      <SelectTrigger className={className}>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <SelectValue placeholder={isLoading ? "Loading..." : "Select resume"}>
            {selectedResume
              ? getResumeLabel(selectedResume.file_url)
              : "No resume selected"}
          </SelectValue>
        </div>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">
          <span className="text-muted-foreground">
            No resume (general chat)
          </span>
        </SelectItem>
        {resumes.map((resume) => (
          <SelectItem key={resume.id} value={resume.id}>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{getResumeLabel(resume.file_url)}</span>
              {resume.skills && resume.skills.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({resume.skills.length} skills)
                </span>
              )}
            </div>
          </SelectItem>
        ))}
        {!isLoading && resumes.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No resumes uploaded yet.
            <br />
            <a href="/resume" className="text-primary hover:underline">
              Upload one first
            </a>
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
