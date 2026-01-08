import { useEffect, useRef } from "react";
import { useChatStore } from "../../stores/chat.store";
import ReactMarkdown from "react-markdown";

export function MessageList() {
  const { messages, isStreaming, streamingContent } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="h-full overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                message.role === "user"
                  ? "bg-zinc-100 text-zinc-900"
                  : "bg-charcoal text-zinc-100 border border-zinc-700"
              }`}
            >
              <ReactMarkdown
                className="prose prose-invert prose-sm max-w-none"
                components={{
                  code: ({ inline, className, children, ...props }: any) => {
                    return !inline ? (
                      <div className="relative">
                        <pre className="bg-black/30 rounded-lg p-4 overflow-x-auto">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </pre>
                        <button
                          onClick={() =>
                            navigator.clipboard.writeText(String(children))
                          }
                          className="absolute top-2 right-2 p-2 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-white"
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <code
                        className="bg-black/30 px-1.5 py-0.5 rounded text-sm font-mono"
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

              <p className="text-xs text-zinc-500 mt-2">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] bg-charcoal text-zinc-100 border border-zinc-700 rounded-2xl px-6 py-4">
              <ReactMarkdown className="prose prose-invert prose-sm max-w-none">
                {streamingContent}
              </ReactMarkdown>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-zinc-400 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
