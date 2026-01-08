import { useCallback, useState } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Progress } from "../ui/Progress";
import { useResumeStore } from "../../stores/resume.store";
import { resumeService } from "../../services/resume.service";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/msword": [".doc"],
};

type UploadStatus = "idle" | "uploading" | "processing" | "success" | "error";

export function ResumeUpload() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { addResume, setUploadProgress, uploadProgress } = useResumeStore();

  const handleUpload = useCallback(
    async (file: File) => {
      setSelectedFile(file);
      setError(null);
      setStatus("uploading");
      setUploadProgress(0);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(Math.min(uploadProgress + 10, 60));
        }, 200);

        setStatus("processing");
        const resume = await resumeService.uploadResume(file);

        clearInterval(progressInterval);
        setUploadProgress(100);
        setStatus("success");
        addResume(resume);

        // Reset after success
        setTimeout(() => {
          setStatus("idle");
          setSelectedFile(null);
          setUploadProgress(0);
        }, 2000);
      } catch (err) {
        setStatus("error");
        setError(
          err instanceof Error ? err.message : "Failed to upload resume",
        );
        setUploadProgress(0);
      }
    },
    [addResume, setUploadProgress, uploadProgress],
  );

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        const rejection = fileRejections[0];
        if (rejection.errors.some((e) => e.code === "file-too-large")) {
          setError("File is too large. Maximum size is 5MB.");
        } else if (
          rejection.errors.some((e) => e.code === "file-invalid-type")
        ) {
          setError("Invalid file type. Only PDF and DOCX files are accepted.");
        } else {
          setError("Invalid file. Please try again.");
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0]);
      }
    },
    [handleUpload],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1,
    disabled: status === "uploading" || status === "processing",
  });

  const clearError = () => {
    setError(null);
    setStatus("idle");
    setSelectedFile(null);
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
          "hover:border-primary/50 hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5 scale-[1.02]",
          status === "error" && "border-destructive bg-destructive/5",
          status === "success" && "border-green-500 bg-green-500/5",
          (status === "uploading" || status === "processing") &&
            "pointer-events-none opacity-80",
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center justify-center gap-4 text-center">
          {status === "idle" && !error && (
            <>
              <div
                className={cn(
                  "w-16 h-16 rounded-full bg-muted flex items-center justify-center transition-transform",
                  isDragActive && "scale-110 bg-primary/10",
                )}
              >
                <Upload
                  className={cn(
                    "w-8 h-8 text-muted-foreground transition-colors",
                    isDragActive && "text-primary",
                  )}
                />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  {isDragActive
                    ? "Drop your resume here"
                    : "Upload your resume"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag and drop or click to browse
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="w-4 h-4" />
                <span>PDF, DOC, DOCX up to 5MB</span>
              </div>
            </>
          )}

          {(status === "uploading" || status === "processing") &&
            selectedFile && (
              <>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-primary animate-pulse" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {selectedFile.name}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {status === "uploading"
                      ? "Uploading..."
                      : "Analyzing with AI..."}
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </>
            )}

          {status === "success" && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  Upload Complete!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your resume has been analyzed successfully.
                </p>
              </div>
            </>
          )}

          {status === "error" && error && (
            <>
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <p className="text-lg font-medium text-foreground">
                  Upload Failed
                </p>
                <p className="text-sm text-destructive mt-1">{error}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearError();
                }}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
