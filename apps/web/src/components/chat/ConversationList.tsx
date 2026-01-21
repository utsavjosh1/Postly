import { FileText, Trash2, MessageSquare } from "lucide-react";
import { useChatStore } from "../../stores/chat.store";
import { chatService } from "../../services/chat.service";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip";
import { useMemo } from "react";
import type { Conversation } from "@postly/shared-types";

// Helper to categorize dates
const getRelativeDateGroup = (dateStr: string | Date | undefined) => {
  if (!dateStr) return "Older";
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= sevenDaysAgo) return "Previous 7 Days";
  return "Older";
};

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

  const groupedConversations = useMemo(() => {
    const groups: Record<string, Conversation[]> = {
      "Today": [],
      "Yesterday": [],
      "Previous 7 Days": [],
      "Older": []
    };

    conversations.forEach(conv => {
      // Assuming 'created_at' or 'updated_at' exists. Using created_at for now.
      const group = getRelativeDateGroup(conv.created_at || conv.updated_at);
      if (groups[group]) {
        groups[group].push(conv);
      } else {
        groups["Older"].push(conv);
      }
    });

    return groups;
  }, [conversations]);

  const groupOrder = ["Today", "Yesterday", "Previous 7 Days", "Older"];

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {conversations.length === 0 && (
           <div className="text-center py-8 px-4">
            <p className="text-sm text-zinc-500">No conversations yet.</p>
          </div>
        )}

        {groupOrder.map((group) => {
          const groupConvs = groupedConversations[group];
          if (groupConvs.length === 0) return null;

          return (
            <div key={group}>
              <h3 className="px-2 py-1.5 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                {group}
              </h3>
              <div className="space-y-0.5">
                {groupConvs.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`w-full px-3 py-2 text-sm rounded-lg text-left transition-all duration-200 group relative overflow-hidden flex items-center gap-2 ${
                      activeConversationId === conv.id
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white"
                    }`}
                  >
                    {/* Icon */}
                    {conv.resume_id ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <FileText className={`w-4 h-4 shrink-0 transition-colors ${
                              activeConversationId === conv.id ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-300"
                            }`} />
                          </TooltipTrigger>
                          <TooltipContent>Resume Context</TooltipContent>
                        </Tooltip>
                      ) : (
                        <MessageSquare className={`w-4 h-4 shrink-0 transition-colors ${
                          activeConversationId === conv.id ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                        }`} />
                      )}
                      
                    <span className="truncate flex-1">
                        {conv.title || "New Chat"}
                    </span>

                    {/* Delete Action (visible on hover) */}
                    <div
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className={`opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-400 ${
                          activeConversationId === conv.id ? "opacity-0 group-hover:opacity-100" : ""
                        }`}
                        aria-label="Delete conversation"
                        role="button"
                        tabIndex={0}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
            </div>
          </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
