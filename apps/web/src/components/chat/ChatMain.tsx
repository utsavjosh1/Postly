import { useChatStore } from "../../stores/chat.store";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Menu } from "lucide-react";
import { useSSEChat } from "../../hooks/useSSEChat";

export function ChatMain() {
  const { activeConversationId, toggleSidebar } = useChatStore();
  const { sendMessage } = useSSEChat();

  const handlePillClick = (text: string) => {
    sendMessage(text);
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-zinc-900 relative overflow-hidden text-zinc-100 font-sans selection:bg-purple-500/30">
      {/* Mobile Menu Button - Shown only when sidebar is closed on desktop or always on mobile if needed */}
      <div className="hidden">
        {/* We handle menu via header now, but if activeConversationId is null (empty state) we need a trigger */}
      </div>

      {!activeConversationId && (
        <button
          onClick={toggleSidebar}
          className="absolute top-4 left-4 z-50 p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative w-full h-full">
        {activeConversationId ? (
          // ACTIVE STATE: Chat Interface
          <>
            {/* Minimal Header */}
            <header className="h-14 flex items-center justify-between px-4 border-b border-white/5 bg-zinc-900/50 backdrop-blur-sm shrink-0 z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleSidebar}
                  className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-zinc-400 hidden sm:block">
                  New Chat
                </span>
              </div>
            </header>

            {/* Messages */}
            <div className="flex-1 relative min-h-0">
              <MessageList />
            </div>

            {/* Input Footer */}
            <div className="shrink-0 w-full max-w-3xl mx-auto px-4 pb-6 pt-2 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent z-20 transition-all duration-500">
              <ChatInput />
              <div className="text-center mt-2">
                <p className="text-[10px] text-zinc-600">
                  AI can make mistakes. Verify important information.
                </p>
              </div>
            </div>
          </>
        ) : (
          // EMPTY STATE: Centered Search
          <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-full w-full max-w-3xl mx-auto animate-in fade-in zoom-in-95 duration-500">
            {/* Logo/Greeting */}
            <div className="mb-10 text-center space-y-4">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 tracking-tight">
                What can I help you with?
              </h1>
            </div>

            {/* Centered Input */}
            <div className="w-full max-w-2xl relative z-10">
              <ChatInput />
            </div>

            {/* Quick Actions / Pills */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-2xl animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">
              {SUGGESTION_PILLS.map((pill, i) => (
                <button
                  key={i}
                  onClick={() => handlePillClick(pill)}
                  className="px-4 py-2 rounded-full bg-zinc-800/50 hover:bg-zinc-700 border border-white/5 hover:border-white/10 text-sm text-zinc-400 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

const SUGGESTION_PILLS = [
  "Analyze my resume",
  "Mock Interview",
  "Write a cover letter",
  "Find remote jobs",
];
