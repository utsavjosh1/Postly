import { FileText, Trash2 } from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import { chatService } from '../../services/chat.service';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

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
    <TooltipProvider>
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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate flex-1">{conv.title}</p>
                  {conv.resume_id && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex-shrink-0">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Resume context enabled
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
                aria-label="Delete conversation"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            </div>
          </button>
        ))}
      </div>
    </TooltipProvider>
  );
}
