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
    <div className="h-full overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
      <div className="max-w-3xl mx-auto space-y-8">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* AI Avatar */}
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-5 h-5 text-primary" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-6 py-4 shadow-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-card text-card-foreground rounded-bl-sm border border-border"
              }`}
            >
              <ReactMarkdown
                className={`prose prose-sm max-w-none ${
                  message.role === "user" ? "prose-invert" : "dark:prose-invert"
                }`}
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
                      <div className="relative group my-4 rounded-lg overflow-hidden border border-border bg-muted/50">
                        <div className="flex items-center justify-between px-4 py-2 bg-muted border-b border-border">
                          <span className="text-xs text-muted-foreground font-mono">Code</span>
                          <button
                            onClick={handleCopy}
                            className="p-1.5 hover:bg-background rounded transition-colors"
                          >
                            {copied ? (
                              <Check className="w-3.5 h-3.5 text-success" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                        <pre className="!m-0 !p-4 overflow-x-auto !bg-transparent">
                          <code className={`!bg-transparent font-mono text-sm ${className}`} {...props}>
                            {children}
                          </code>
                        </pre>
                      </div>
                    ) : (
                       <code
                        className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono border border-border"
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

              <div className={`text-[10px] mt-2 opacity-70 ${
                message.role === "user" ? "text-primary-foreground/80" : "text-muted-foreground"
              }`}>
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {/* User Avatar */}
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming message */}
        {isStreaming && streamingContent && (
          <div className="flex gap-4 justify-start animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center shrink-0 mt-1 shadow-sm">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            
            <div className="max-w-[85%] bg-card text-card-foreground rounded-2xl rounded-bl-sm px-6 py-4 border border-border shadow-sm">
              <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                {streamingContent}
              </ReactMarkdown>
              <div className="flex items-center gap-1.5 mt-3">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-4" />
      </div>
    </div>
  );
}
