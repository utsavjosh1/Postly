import { useState, useRef, useEffect } from "react";
import { useSSEChat } from "../../hooks/useSSEChat";
import { useChatStore } from "../../stores/chat.store";
import { useToastStore } from "../../stores/toast.store";
import { resumeService } from "../../services/resume.service";
import { Send, Paperclip, Square, X, FileText, Loader2 } from "lucide-react";

interface AttachedFile {
  name: string;
  status: "uploading" | "success" | "error";
  resumeId?: string;
}

export function ChatInput() {
  const [input, setInput] = useState("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { sendMessage, stopGeneration } = useSSEChat();
  const conversationState = useChatStore((state) => state.conversationState);
  const setActiveResumeId = useChatStore((state) => state.setActiveResumeId);
  const { addToast } = useToastStore();

  const isBlocking =
    conversationState === "thinking" || conversationState === "streaming";

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!allowedTypes.includes(file.type)) {
      addToast({
        type: "error",
        message: "Only PDF and DOCX files are allowed",
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      addToast({ type: "error", message: "File size must be less than 5MB" });
      return;
    }

    setAttachedFile({ name: file.name, status: "uploading" });

    try {
      const resume = await resumeService.uploadResume(file);
      setAttachedFile({
        name: file.name,
        status: "success",
        resumeId: resume.id,
      });
      setActiveResumeId(resume.id);
      addToast({ type: "success", message: "Resume uploaded successfully" });
    } catch (error) {
      console.error("Upload failed:", error);
      setAttachedFile({ name: file.name, status: "error" });
      addToast({ type: "error", message: "Failed to upload resume" });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setActiveResumeId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isBlocking) return;

    const message = input.trim();
    setInput(""); // Optimistic clear

    // Reset height immediately
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="relative">
      {/* Attached File Chip */}
      {attachedFile && (
        <div className="mb-2 flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
              attachedFile.status === "uploading"
                ? "bg-zinc-700 text-zinc-300"
                : attachedFile.status === "success"
                  ? "bg-emerald-900/50 text-emerald-300 border border-emerald-700"
                  : "bg-red-900/50 text-red-300 border border-red-700"
            }`}
          >
            {attachedFile.status === "uploading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            <span className="max-w-[200px] truncate">{attachedFile.name}</span>
            {attachedFile.status !== "uploading" && (
              <button
                type="button"
                onClick={handleRemoveFile}
                className="hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative bg-zinc-800 hover:bg-zinc-800/80 focus-within:bg-zinc-800/80 rounded-[24px] border border-transparent flex items-end overflow-hidden transition-colors">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachedFile?.status === "uploading"}
            className="p-2 mb-1 ml-2 text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-all duration-200 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            title="Attach resume (PDF or DOCX)"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Career Assistant..."
            className="w-full px-3 py-3 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none max-h-[200px] min-h-[44px] leading-relaxed text-sm"
            disabled={isBlocking && conversationState !== "thinking"}
            rows={1}
          />

          <div className="pr-2 pb-1.5 flex items-center gap-2">
            {conversationState === "streaming" ||
            conversationState === "thinking" ? (
              <button
                type="button"
                onClick={stopGeneration}
                className="p-2 rounded-full bg-white text-black hover:bg-zinc-200 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center animate-in fade-in zoom-in"
                aria-label="Stop generating"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center hover:scale-105 active:scale-95
                    ${
                      !input.trim()
                        ? "bg-transparent text-zinc-600 cursor-not-allowed"
                        : "bg-white text-black hover:bg-zinc-200"
                    }`}
                aria-label="Send message"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
