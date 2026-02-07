import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { useChatStore } from "../stores/chat.store";
import { chatService } from "../services/chat.service";
import { ChatSidebar } from "../components/chat/ChatSidebar";
import { ChatMain } from "../components/chat/ChatMain";

export function ChatPage() {
  const { setConversations, setActiveConversation, setMessages, setLoading } =
    useChatStore();
  const { id } = useParams<{ id: string }>();

  const { data: conversations } = useQuery({
    queryKey: ["conversations"],
    queryFn: chatService.getConversations,
  });

  useEffect(() => {
    if (conversations) {
      setConversations(conversations);
    }
  }, [conversations, setConversations]);

  // Sync URL ID with store
  useEffect(() => {
    if (id) {
      setActiveConversation(id);
      setLoading(true);
      chatService
        .getConversation(id)
        .then(({ messages }) => {
          setMessages(messages);
        })
        .catch((err) => {
          console.error("Failed to load conversation:", err);
          // TODO: Redirect to /chat if invalid?
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setActiveConversation(null); // Reset if no ID (new chat)
      setMessages([]);
    }
  }, [id, setActiveConversation, setMessages, setLoading]);

  return (
    <div className="fixed inset-0 bg-charcoal flex overflow-hidden">
      <ChatSidebar />
      <ChatMain />
    </div>
  );
}
