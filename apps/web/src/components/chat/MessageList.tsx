import { useEffect, useRef } from "react";
import { useChatStore } from "../../stores/chat.store";
import ReactMarkdown from "react-markdown";
import { User, Bot, Copy, Check } from "lucide-react";
import { useState } from "react";

export function MessageList() {
  const { messages, isStreaming, streamingContent } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  return (
    <div className="h-full overflow-y-auto px-0 py-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      <div className="flex flex-col pb-4 text-zinc-100">
        {messages.map((message) => (
          <div
            key={message.id}
            className="w-full px-4 py-8 border-b border-white/5 bg-transparent"
          >
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
              <div className="relative flex-1 overflow-hidden">
                <div className="font-semibold text-sm mb-1 opacity-90">
                  {message.role === "assistant" ? "Postly" : "You"}
                </div>

                <ReactMarkdown
                  className="prose prose-sm max-w-none prose-invert prose-p:leading-7 prose-pre:p-0 prose-pre:bg-transparent"
                  components={{
                    code: ({ inline, className, children, ...props }: any) => {
                      const [copied, setCopied] = useState(false);
                      const code = String(children).replace(/\n$/, "");

                      const handleCopy = () => {
                        navigator.clipboard.writeText(code);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      };

                      return !inline ? (
                        <div className="relative group my-4 rounded-md overflow-hidden border border-white/10 bg-zinc-950 text-white">
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
                          <pre className="!m-0 !p-4 overflow-x-auto !bg-transparent">
                            <code
                              className={`!bg-transparent font-mono text-sm ${className}`}
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
            </div>
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="w-full px-4 py-8 border-b border-white/5 bg-transparent">
            <div className="max-w-3xl mx-auto flex gap-6">
              <div className="w-8 h-8 rounded-full bg-transparent border border-white/10 text-white flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>

              <div className="relative flex-1 overflow-hidden text-zinc-100">
                <div className="font-semibold text-sm mb-1 opacity-90">
                  Postly
                </div>
                <ReactMarkdown className="prose prose-sm max-w-none prose-invert prose-p:leading-7">
                  {streamingContent}
                </ReactMarkdown>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}
