import { useChatStore } from "../../stores/chat.store";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";

export function ChatMain() {
  const { activeConversationId, toggleSidebar } = useChatStore();

  return (
    <main className="flex-1 flex flex-col h-full bg-darker-charcoal">
      {/* Header with menu toggle */}
      <header className="h-16 border-b border-zinc-800 flex items-center px-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors md:hidden"
          aria-label="Toggle sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>

        <h1 className="ml-4 text-lg font-semibold text-white">
          AI Career Assistant
        </h1>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden">
        {activeConversationId ? <MessageList /> : <EmptyState />}
      </div>

      {/* Input area - sticky bottom */}
      {activeConversationId && <ChatInput />}
    </main>
  );
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-zinc-500">
      <svg
        className="w-16 h-16 mb-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <p className="text-lg">Select a conversation or start a new chat</p>
    </div>
  );
}
