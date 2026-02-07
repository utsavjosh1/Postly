import { useEffect, useRef, memo, useState } from "react";
import { useChatStore } from "../../stores/chat.store";
import { useToastStore } from "../../stores/toast.store";
import { User, Bot, Copy, RefreshCw, Trash2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Message } from "@postly/shared-types";
import { JobCarousel } from "./JobCarousel";

// Memoized Message Item Component
const MessageItem = memo(
  ({
    message,
    onDelete,
    onToast,
  }: {
    message: Message;
    onDelete: (id: string) => void;
    onToast: (type: "success" | "error" | "info", message: string) => void;
  }) => {
    const handleCopy = (text: string) => {
      navigator.clipboard.writeText(text);
      onToast("success", "Copied to clipboard");
    };

    const handleRegenerate = (id: string) => {
      // TODO: Implement regenerate logic
      console.log("Regenerate", id);
      onToast("info", "Regenerating response...");
    };

    const handleDelete = (id: string) => {
      onDelete(id);
      onToast("success", "Message deleted");
    };

    const tryParseJSON = (content: string) => {
      try {
        // Only attempt if it looks like an object or array and not just text
        const trimmed = content.trim();
        if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;

        const parsed = JSON.parse(content);
        if (typeof parsed === "object" && parsed !== null) {
          return parsed;
        }
      } catch {
        return null;
      }

      return null;
    };

    const jsonContent = tryParseJSON(message.content);

    return (
      <div className="w-full px-4 py-8 bg-transparent">
        <div className="max-w-3xl mx-auto flex gap-6">
          {/* Avatar */}
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-white/10 ${
              message.role === "assistant"
                ? "bg-transparent text-white"
                : "bg-zinc-700 text-zinc-300"
            }`}
          >
            {message.role === "assistant" ? (
              <Bot className="w-5 h-5" />
            ) : (
              <User className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="relative flex-1 overflow-hidden group/message">
            <div className="flex items-center justify-between mb-1 opacity-90">
              <span className="font-semibold text-sm">
                {message.role === "assistant" ? "Postly" : "You"}
              </span>

              {/* Message Actions */}
              {/* Message Actions */}
              <div className="invisible group-hover/message:visible flex items-center gap-2 opacity-0 group-hover/message:opacity-100 transition-all duration-200">
                <button
                  onClick={() => handleCopy(message.content)}
                  className="group/btn p-1.5 hover:bg-white/5 rounded-md transition-colors"
                  title="Copy"
                >
                  <div className="relative w-3.5 h-3.5">
                    <div className="absolute inset-0 border border-zinc-400 rounded-sm group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-200" />
                    <div className="absolute inset-0 border border-zinc-400 rounded-sm bg-zinc-900 group-hover/btn:-translate-x-0.5 group-hover/btn:translate-y-0.5 transition-transform duration-200" />
                  </div>
                </button>
                {message.role === "assistant" && (
                  <button
                    onClick={() => handleRegenerate(message.id)}
                    className="group/btn p-1.5 hover:bg-white/5 rounded-md transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-zinc-400 group-hover/btn:text-white group-hover/btn:rotate-180 transition-all duration-500" />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(message.id)}
                  className="group/btn p-1.5 hover:bg-red-500/10 rounded-md transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-400 group-hover/btn:text-red-400 transition-colors duration-200" />
                </button>
              </div>
            </div>

            {jsonContent ? (
              // Rich UI based on JSON type
              jsonContent.type === "job_carousel" ? (
                <JobCarousel
                  message={jsonContent.message}
                  data={jsonContent.data}
                  suggested_actions={jsonContent.suggested_actions}
                  onApply={(id) => console.log("Apply to job:", id)}
                />
              ) : jsonContent.type === "application_modal" ? (
                <div className="rounded-lg border border-white/10 bg-zinc-900/50 p-6 max-w-sm">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    Start Application
                  </h3>
                  <p className="text-zinc-400 mb-4">{jsonContent.message}</p>
                  <button className="w-full py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors">
                    Continue Application
                  </button>
                </div>
              ) : jsonContent.type === "text_bubble" ? (
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none prose-invert prose-p:leading-7">
                    <ReactMarkdown>{jsonContent.message}</ReactMarkdown>
                  </div>
                  {jsonContent.suggested_actions && (
                    <div className="flex flex-wrap gap-2">
                      {jsonContent.suggested_actions.map(
                        (action: string, i: number) => (
                          <button
                            key={i}
                            className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-zinc-300 transition-colors"
                          >
                            {action}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Fallback for other valid JSON
                <div className="rounded-md border border-white/10 bg-zinc-950/50 overflow-hidden mt-2">
                  <div className="px-4 py-2 border-b border-white/10 bg-zinc-900/50 flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400">
                      JSON Data
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(JSON.stringify(jsonContent, null, 2))
                      }
                      className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      Copy JSON
                    </button>
                  </div>
                  <pre className="p-4 overflow-x-auto text-xs font-mono text-zinc-300">
                    {JSON.stringify(jsonContent, null, 2)}
                  </pre>
                </div>
              )
            ) : (
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none prose-invert prose-p:leading-7 prose-pre:p-0 prose-pre:bg-transparent">
                  <ReactMarkdown
                    components={{
                      code: ({
                        inline,
                        className,
                        children,
                        ...props
                      }: React.ComponentPropsWithoutRef<"code"> & {
                        inline?: boolean;
                      }) => {
                        const [copied, setCopied] = useState(false);
                        const code = String(children).replace(/\n$/, "");

                        const handleCopy = () => {
                          navigator.clipboard.writeText(code);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        };

                        return !inline ? (
                          <div className="relative group my-4 rounded-md overflow-hidden border border-white/10 bg-zinc-950 text-white cursor-text">
                            <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/50 border-b border-white/10">
                              <span className="text-xs text-zinc-400 font-mono">
                                Code
                              </span>
                              <button
                                onClick={handleCopy}
                                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                              >
                                {copied ? (
                                  <Check className="w-3.5 h-3.5 text-green-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                                )}
                              </button>
                            </div>
                            <pre className="m-0! p-4! overflow-x-auto bg-transparent!">
                              <code
                                className={`bg-transparent! font-mono text-sm ${className}`}
                                {...props}
                              >
                                {children}
                              </code>
                            </pre>
                          </div>
                        ) : (
                          <code
                            className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-white"
                            {...props}
                          >
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>

                {/* Render job matches from metadata */}
                {message.role === "assistant" &&
                  message.metadata?.job_matches &&
                  Array.isArray(message.metadata.job_matches) &&
                  message.metadata.job_matches.length > 0 && (
                    <JobCarousel
                      message=""
                      data={(
                        message.metadata.job_matches as Array<{
                          job: any; // Using any to avoid complex type import for now, but in real app should be Job
                          match_score?: number;
                          ai_explanation?: string;
                        }>
                      ).map((match) => ({
                        ...match.job,
                        match_score: match.match_score,
                        ai_explanation: match.ai_explanation,
                      }))}
                      onApply={(id) => console.log("Apply to job:", id)}
                    />
                  )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to ensure we only re-render if message content changes
    return (
      prevProps.message.content === nextProps.message.content &&
      prevProps.message.id === nextProps.message.id
    );
  },
);

export function MessageList() {
  const { messages, conversationState, streamingContent, deleteMessage } =
    useChatStore();
  const { addToast } = useToastStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, conversationState]);

  const handleToast = (type: "success" | "error" | "info", message: string) => {
    addToast({ type, message });
  };

  return (
    <div className="h-full overflow-y-auto px-0 py-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      <div className="flex flex-col pb-4 text-zinc-100">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onDelete={deleteMessage}
            onToast={handleToast}
          />
        ))}

        {/* State Indicators */}
        {(conversationState === "streaming" ||
          conversationState === "thinking" ||
          conversationState === "typing") && (
          <div className="w-full px-4 py-8 border-b border-white/5 bg-transparent animate-in fade-in slide-in-from-bottom-2">
            <div className="max-w-3xl mx-auto flex gap-6">
              <div className="w-8 h-8 rounded-full bg-transparent border border-white/10 text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>

              <div className="relative flex-1 overflow-hidden text-zinc-100">
                <div className="font-semibold text-sm mb-1 opacity-90">
                  Postly
                </div>

                {conversationState === "streaming" ? (
                  <>
                    <div className="prose prose-sm max-w-none prose-invert prose-p:leading-7">
                      <ReactMarkdown>{streamingContent}</ReactMarkdown>
                    </div>
                    <span className="inline-block w-2 h-4 ml-1 align-middle bg-zinc-400 animate-pulse">
                      |
                    </span>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-zinc-400 text-sm">
                    {conversationState === "thinking" && (
                      <div className="flex items-center gap-1 h-6">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce"></span>
                      </div>
                    )}
                    {conversationState === "typing" && (
                      <span className="animate-pulse italic">typing...</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}
