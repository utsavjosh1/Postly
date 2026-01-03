import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChatStore } from '../stores/chat.store';
import { chatService } from '../services/chat.service';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatMain } from '../components/chat/ChatMain';

export function ChatPage() {
  const { setConversations } = useChatStore();

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: chatService.getConversations,
  });

  useEffect(() => {
    if (conversations) {
      setConversations(conversations);
    }
  }, [conversations, setConversations]);

  return (
    <div className="fixed inset-0 bg-charcoal flex overflow-hidden">
      <ChatSidebar />
      <ChatMain />
    </div>
  );
}
