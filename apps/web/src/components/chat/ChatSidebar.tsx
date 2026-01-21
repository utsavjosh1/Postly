import { useState } from "react";
import { Plus, LogOut, FileText, MessageSquare } from "lucide-react";
import { useChatStore } from "../../stores/chat.store";
import { useAuthStore } from "../../stores/auth.store";
import { chatService } from "../../services/chat.service";
import { ConversationList } from "./ConversationList";
import { ResumeSelector } from "./ResumeSelector";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/Dialog";
import { Button } from "../ui/Button";

export function ChatSidebar() {
  const { addConversation, setActiveConversation } = useChatStore();
  const { user, logout } = useAuthStore();
  
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>();
  const [isCreating, setIsCreating] = useState(false);

  const handleNewChat = async () => {
    setIsCreating(true);
    try {
      const conv = await chatService.createConversation(selectedResumeId);
      addConversation(conv);
      setActiveConversation(conv.id);
      setIsNewChatDialogOpen(false);
      setSelectedResumeId(undefined);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleQuickNewChat = async () => {
    setIsCreating(true);
    try {
      const conv = await chatService.createConversation();
      addConversation(conv);
      setActiveConversation(conv.id);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <aside className="w-[260px] h-full bg-zinc-900 border-r border-white/10 flex flex-col shrink-0 transition-all duration-300 text-zinc-100">
        {/* Header (New Chat) */}
        <div className="p-3 space-y-2">
           <button
             onClick={handleQuickNewChat}
             disabled={isCreating}
             className="group w-full px-3 py-2.5 bg-transparent hover:bg-zinc-800 rounded-lg border border-white/20 text-sm text-left transition-all duration-200 flex items-center justify-between"
           >
             <div className="flex items-center gap-2 text-zinc-100">
               <Plus className="w-4 h-4" />
               <span className="font-medium">New chat</span>
             </div>
             <MessageSquare className="w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity" />
           </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          <div className="px-3 pb-2">
            <h3 className="px-2 py-2 text-xs font-medium text-zinc-500">
              Today
            </h3>
            {/* We might need to pass a specific dark theme adaptation to ConversationList */}
           <div className="text-zinc-300">
             <ConversationList />
           </div>
          </div>
        </div>

        {/* User Profile & Settings */}
        <div className="p-3 border-t border-white/10 bg-zinc-900">
          <div className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-zinc-800 cursor-pointer transition-colors group relative">
             <div className="w-8 h-8 rounded bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-100 uppercase">
                {user?.name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-100 truncate">
                  {user?.name || "User"}
                </p>
              </div>
              
              {/* Dropdown/Settings trigger could go here, for now simple logout/settings */}
              <div className="flex items-center">
                 <button 
                  onClick={logout}
                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
          </div>
        </div>
      </aside>

      {/* New Chat Dialog */}
      <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-xl">Start New Chat</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Select a resume to get personalized AI career advice.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-200 block flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Select Resume (Optional)
              </label>
              <ResumeSelector
                value={selectedResumeId}
                onChange={setSelectedResumeId}
                className="w-full bg-zinc-800 border-zinc-700 focus:border-purple-500 text-zinc-100"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewChatDialogOpen(false)}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleNewChat} 
              disabled={isCreating}
              className="bg-white text-black hover:bg-zinc-200"
            >
              Start Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
