import { FileText, Trash2, MessageSquare } from "lucide-react";
import { useChatStore } from "../../stores/chat.store";
import { useToastStore } from "../../stores/toast.store";
import { chatService } from "../../services/chat.service";
import { cn } from "../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/Tooltip";
import { useMemo, useState } from "react";
import type { Conversation } from "@postly/shared-types";
import { AlertDialog } from "../ui/AlertDialog";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore(
    (state) => state.activeConversationId,
  );
  // We don't need setActiveConversation here anymore as navigation handles it via ChatPage
  const deleteConversation = useChatStore((state) => state.deleteConversation);
  const { addToast } = useToastStore();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSelectConversation = (id: string) => {
    navigate(`/chat/${id}`);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      await chatService.deleteConversation(deleteId);
      deleteConversation(deleteId);
      addToast({
        type: "success",
        message: "Conversation deleted",
        duration: 3000,
      });
      setDeleteId(null);
    } catch (error) {
      console.error(error);
      addToast({
        type: "error",
        message: "Failed to delete conversation",
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const groupedConversations = useMemo(() => {
    const groups: Record<string, Conversation[]> = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    conversations.forEach((conv) => {
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
    <>
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
                <h3 className="px-3 py-2 text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
                  {group}
                </h3>
                <div className="space-y-0.5">
                  {groupConvs.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectConversation(conv.id)}
                      className={cn(
                        "w-full px-3 py-2 text-sm rounded-lg text-left transition-colors duration-200 group relative overflow-hidden grid grid-cols-[20px_1fr_20px] gap-3 items-center",
                        activeConversationId === conv.id
                          ? "bg-zinc-800 text-white"
                          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-white",
                      )}
                    >
                      {/* Icon Column */}
                      <div className="flex items-center justify-center">
                        {conv.resume_id ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <FileText
                                className={cn(
                                  "w-4 h-4 transition-colors",
                                  activeConversationId === conv.id
                                    ? "text-purple-400"
                                    : "text-zinc-500 group-hover:text-zinc-300",
                                )}
                              />
                            </TooltipTrigger>
                            <TooltipContent>Resume Context</TooltipContent>
                          </Tooltip>
                        ) : (
                          <MessageSquare
                            className={cn(
                              "w-4 h-4 transition-colors",
                              activeConversationId === conv.id
                                ? "text-white"
                                : "text-zinc-500 group-hover:text-zinc-300",
                            )}
                          />
                        )}
                      </div>

                      {/* Text Column */}
                      <span className="truncate leading-5">
                        {conv.title || "New Chat"}
                      </span>

                      {/* Action Column */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(conv.id);
                        }}
                        className={cn(
                          "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-700 rounded text-zinc-400 hover:text-red-400",
                          activeConversationId === conv.id &&
                            "opacity-0 group-hover:opacity-100",
                        )}
                        aria-label="Delete conversation"
                        role="button"
                        tabIndex={0}
                      >
                        <Trash2 className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </TooltipProvider>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Conversation?"
        description="This action cannot be undone. The chat history will be permanently removed."
        onConfirm={confirmDelete}
        isLoading={isDeleting}
        confirmText="Delete"
        variant="destructive"
      />
    </>
  );
}
