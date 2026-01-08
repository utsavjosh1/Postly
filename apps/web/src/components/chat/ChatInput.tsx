import { useState, useRef, useEffect } from "react";
import { useSSEChat } from "../../hooks/useSSEChat";
import { useChatStore } from "../../stores/chat.store";

export function ChatInput() {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { sendMessage } = useSSEChat();
  const { isStreaming } = useChatStore();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    await sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-zinc-800 bg-darker-charcoal p-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about jobs, resumes, or career advice..."
            className="w-full px-4 py-3 pr-12 bg-charcoal border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 resize-none"
            style={{ maxHeight: "240px" }}
            disabled={isStreaming}
            rows={1}
          />

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="absolute right-2 bottom-2 p-2 bg-zinc-100 hover:bg-white disabled:bg-zinc-700 disabled:cursor-not-allowed text-zinc-900 disabled:text-zinc-500 rounded-lg transition-colors"
            aria-label="Send message"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>

        <p className="text-xs text-zinc-500 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </form>
    </div>
  );
}
