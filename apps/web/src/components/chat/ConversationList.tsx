import { FileText, Trash2, MessageSquare } from "lucide-react";
import { useChatStore } from "../../stores/chat.store";
import { chatService } from "../../services/chat.service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip";

export function ConversationList() {
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    setMessages,
    deleteConversation,
  } = useChatStore();

  const handleSelectConversation = async (id: string) => {
    setActiveConversation(id);
    const { messages } = await chatService.getConversation(id);
    setMessages(messages);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this conversation?")) {
      await chatService.deleteConversation(id);
      deleteConversation(id);
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-1">
        {conversations.map((conv) => (
          <button
            key={conv.id}
            onClick={() => handleSelectConversation(conv.id)}
            className={`w-full px-3 py-3 rounded-lg text-left transition-all duration-200 group border relative overflow-hidden ${
              activeConversationId === conv.id
                ? "bg-primary/10 border-primary/20 text-foreground shadow-sm"
                : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {/* Active Indication Bar */}
            {activeConversationId === conv.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l" />
            )}

            <div className="flex items-start justify-between gap-3 pl-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {conv.resume_id ? (
                     <Tooltip>
                      <TooltipTrigger asChild>
                        <FileText className={`w-4 h-4 shrink-0 transition-colors ${
                          activeConversationId === conv.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        }`} />
                      </TooltipTrigger>
                      <TooltipContent>Resume Context</TooltipContent>
                    </Tooltip>
                  ) : (
                    <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${
                       activeConversationId === conv.id ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    }`} />
                  )}
                  
                  <p className={`text-sm font-medium truncate flex-1 ${
                    activeConversationId === conv.id ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                  }`}>
                    {conv.title}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteConversation(conv.id, e)}
                className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-destructive/10 hover:text-destructive rounded-md -mr-1"
                aria-label="Delete conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </button>
        ))}
        {conversations.length === 0 && (
          <div className="text-center py-8 px-4">
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
            <p className="text-xs text-muted-foreground/80 mt-1">Start a new chat to begin.</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
