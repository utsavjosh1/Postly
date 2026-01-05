import { useState } from 'react';
import { Plus, Settings } from 'lucide-react';
import { useChatStore } from '../../stores/chat.store';
import { chatService } from '../../services/chat.service';
import { ConversationList } from './ConversationList';
import { ResumeSelector } from './ResumeSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import { Button } from '../ui/Button';

export function ChatSidebar() {
  const { addConversation, setActiveConversation } = useChatStore();
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
      console.error('Failed to create conversation:', error);
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
      console.error('Failed to create conversation:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      <aside className="w-70 h-full bg-charcoal border-r border-zinc-800 flex flex-col">
        {/* Header with New Chat button */}
        <div className="p-4 border-b border-zinc-800 space-y-2">
          <button
            onClick={() => setIsNewChatDialogOpen(true)}
            className="w-full px-4 py-3 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Chat</span>
          </button>
          <button
            onClick={handleQuickNewChat}
            disabled={isCreating}
            className="w-full px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Quick chat (no resume)
          </button>
        </div>

        {/* Conversation list - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList />
        </div>

        {/* Footer with settings */}
        <div className="p-4 border-t border-zinc-800">
          <button className="w-full px-4 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </aside>

      {/* New Chat Dialog */}
      <Dialog open={isNewChatDialogOpen} onOpenChange={setIsNewChatDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start New Chat</DialogTitle>
            <DialogDescription>
              Select a resume to get personalized career advice and job recommendations.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Select Resume (Optional)
            </label>
            <ResumeSelector
              value={selectedResumeId}
              onChange={setSelectedResumeId}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {selectedResumeId
                ? 'The AI will use your resume to provide personalized advice.'
                : 'Start without a resume for general career questions.'}
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewChatDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNewChat} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Start Chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
