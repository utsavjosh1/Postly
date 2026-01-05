import { useChatStore } from '../../stores/chat.store';
import { chatService } from '../../services/chat.service';
import { ConversationList } from './ConversationList';

export function ChatSidebar() {
  const { addConversation, setActiveConversation } = useChatStore();

  const handleNewChat = async () => {
    const conv = await chatService.createConversation();
    addConversation(conv);
    setActiveConversation(conv.id);
  };

  return (
    <aside className="w-70 h-full bg-charcoal border-r border-zinc-800 flex flex-col">
      {/* Header with New Chat button */}
      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={handleNewChat}
          className="w-full px-4 py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </button>
      </div>

      {/* Conversation list - scrollable */}
      <div className="flex-1 overflow-y-auto">
        <ConversationList />
      </div>

      {/* Footer with settings */}
      <div className="p-4 border-t border-zinc-800">
        <button className="w-full px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
