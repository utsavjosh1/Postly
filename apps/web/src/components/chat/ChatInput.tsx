import { useState, useRef, useEffect } from "react";
import { useSSEChat } from "../../hooks/useSSEChat";
import { useChatStore } from "../../stores/chat.store";
import { Send, Paperclip } from "lucide-react";

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
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative bg-zinc-800 hover:bg-zinc-800/80 focus-within:bg-zinc-800/80 rounded-[26px] border border-transparent flex items-end overflow-hidden transition-colors">
          {/* Attachment Icon (Placeholder for now) */}
          <button
            type="button"
            className="p-3 mb-1 ml-2 text-zinc-400 hover:text-zinc-200 transition-colors rounded-full"
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message AI Career Assistant..."
            className="w-full px-3 py-4 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none max-h-[200px] min-h-[52px]"
            disabled={isStreaming}
            rows={1}
          />

          <div className="pr-3 pb-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center
                ${
                  !input.trim() || isStreaming
                    ? "bg-transparent text-zinc-600 cursor-not-allowed"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              aria-label="Send message"
            >
              {isStreaming ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
