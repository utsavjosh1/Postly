import { useChatStore } from '../../stores/chat.store';
import { chatService } from '../../services/chat.service';

export function ConversationList() {
  const { conversations, activeConversationId, setActiveConversation, setMessages, deleteConversation } =
    useChatStore();

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    const { messages } = await chatService.getConversation(id);
    setMessages(messages);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation?')) {
      await chatService.deleteConversation(id);
      deleteConversation(id);
    }
  };

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => handleSelectConversation(conv.id)}
          className={`w-full px-3 py-3 rounded-lg text-left transition-colors group ${
            activeConversationId === conv.id
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{conv.title}</p>
            </div>

            <button
              onClick={(e) => handleDeleteConversation(conv.id, e)}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
              aria-label="Delete conversation"
            >
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </button>
      ))}
    </div>
  );
}
