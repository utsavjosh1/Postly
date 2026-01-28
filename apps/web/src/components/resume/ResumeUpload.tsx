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
          "group relative border border-dashed rounded-2xl p-10 transition-all duration-300 cursor-pointer overflow-hidden",
          "bg-zinc-900/30 backdrop-blur-sm",
          "border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/50",
          isDragActive &&
            "border-indigo-500 bg-indigo-500/5 ring-1 ring-indigo-500/20",
          status === "error" && "border-red-500/50 bg-red-500/5",
          status === "success" && "border-green-500/50 bg-green-500/5",
          (status === "uploading" || status === "processing") &&
            "pointer-events-none opacity-80",
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <input {...getInputProps()} />

        <div className="relative flex flex-col items-center justify-center gap-6 text-center z-10">
          {status === "idle" && !error && (
            <>
              <div
                className={cn(
                  "w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all duration-300 shadow-xl",
                  isDragActive &&
                    "scale-110 border-indigo-500/50 bg-indigo-500/10 shadow-indigo-500/20",
                  "group-hover:border-zinc-700 group-hover:bg-zinc-800",
                )}
              >
                <Upload
                  className={cn(
                    "w-8 h-8 text-zinc-400 transition-colors duration-300",
                    isDragActive
                      ? "text-indigo-400"
                      : "group-hover:text-zinc-100",
                  )}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xl font-medium text-zinc-100 transition-colors group-hover:text-white">
                  {isDragActive
                    ? "Drop your resume anywhere"
                    : "Upload your resume"}
                </p>
                <p className="text-sm text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
                  Drag and drop your PDF or DOCX file here, or click to browse
                  files
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium px-3 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800/50">
                <FileText className="w-3.5 h-3.5" />
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
