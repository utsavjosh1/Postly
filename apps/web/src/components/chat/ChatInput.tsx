import { useState, useRef, useEffect } from "react";
import { useSSEChat } from "../../hooks/useSSEChat";
import { useChatStore } from "../../stores/chat.store";
import { Send, Sparkles } from "lucide-react";

export function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage } = useSSEChat();
  const { isStreaming } = useChatStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    await sendMessage(input.trim());
    setInput("");
    
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="p-4 bg-background/80 backdrop-blur-xl border-t border-border relative z-20">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative group">
        
        {/* Glowing border effect using accent color */}
        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary to-accent rounded-xl opacity-0 group-focus-within:opacity-30 transition-opacity duration-300 blur-sm"></div>

        <div className="relative bg-card rounded-xl border border-border shadow-lg flex items-end overflow-hidden focus-within:border-primary/50 transition-colors">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about jobs, resumes, or career advice..."
            className="w-full px-5 py-4 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none resize-none max-h-[200px] min-h-[60px]"
            disabled={isStreaming}
            rows={1}
          />

          <div className="pr-3 pb-3 flex items-center gap-2">
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className={`p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center
                ${!input.trim() || isStreaming 
                  ? "bg-muted text-muted-foreground cursor-not-allowed" 
                  : "bg-primary text-primary-foreground hover:shadow-lg hover:shadow-primary/25 active:scale-95 transform"
                }`}
              aria-label="Send message"
            >
              {isStreaming ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mt-3 text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
          <Sparkles className="w-3 h-3 text-primary/50" />
          <span>AI Assisted • Markdown Supported</span>
        </div>
      </form>
    </div>
  );
}
