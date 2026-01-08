import { useState } from "react";
import { Plus, Settings, LogOut, FileText, MessageSquare } from "lucide-react";
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
      <aside className="w-[300px] h-full bg-card border-r border-border flex flex-col shrink-0 transition-all duration-300">
        {/* Header */}
        <div className="p-4 space-y-3 border-b border-border">
          <button
            onClick={() => setIsNewChatDialogOpen(true)}
            className="group w-full px-4 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
            <span>New Chat</span>
          </button>
          
          <button
            onClick={handleQuickNewChat}
            disabled={isCreating}
            className="w-full px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 border border-transparent hover:border-border"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Quick chat (no resume)</span>
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="p-2">
            <h3 className="px-2 pb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Recent Chats
            </h3>
            <ConversationList />
          </div>
        </div>

        {/* User Profile & Settings */}
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground uppercase">
              {user?.name?.[0] || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button className="flex-1 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg text-sm transition-colors flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
            <button 
              onClick={logout}
              className="px-3 py-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg text-sm transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* New Chat Dialog */}
      <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-xl">Start New Chat</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Select a resume to get personalized AI career advice.
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground block flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Select Resume (Optional)
              </label>
              <ResumeSelector
                value={selectedResumeId}
                onChange={setSelectedResumeId}
                className="w-full bg-background border-input focus:border-primary text-foreground"
              />
            </div>
            
            <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
              <p className="text-xs text-primary/80">
                {selectedResumeId
                  ? "✓ The AI will analyze your selected resume to provide tailored job matches and advice."
                  : "ℹ️ Starting without a resume handles general career questions."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewChatDialogOpen(false)}
              className="text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleNewChat} 
              disabled={isCreating}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isCreating ? "Creating..." : "Start Chat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
