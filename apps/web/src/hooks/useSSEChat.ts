import { useCallback } from "react";
import { useChatStore } from "../stores/chat.store";
import { useToastStore } from "../stores/toast.store";
import { chatService } from "../services/chat.service";
import type { StreamChatResponse, Message } from "@postly/shared-types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useSSEChat() {
  const {
    activeConversationId,
    addMessage,
    updateStreamingContent,
    clearStreamingContent,
    setStreaming,
    setActiveConversation,
    addConversation,
  } = useChatStore();

  const { addToast } = useToastStore();

  const sendMessage = useCallback(
    async (message: string) => {
      let currentConversationId = activeConversationId;

      // OPTIMISTIC UI: Add user message immediately
      const tempUserMsgId = crypto.randomUUID();
      const userMsg: Message = {
        id: tempUserMsgId,
        conversation_id: currentConversationId || "temp", // Placeholder if no ID yet
        role: "user",
        content: message,
        created_at: new Date(),
      };

      // If we have a conversation, add message now.
      // If NOT, we wait until we have the ID so the store state is consistent.
      if (currentConversationId) {
        addMessage(userMsg);
      }

      setStreaming(true);
      clearStreamingContent();

      try {
        // 1. Create conversation if needed
        if (!currentConversationId) {
          try {
            const newConv = await chatService.createConversation(
              undefined,
              message,
            );
            currentConversationId = newConv.id;
            addConversation(newConv);
            setActiveConversation(newConv.id);

            // Now add the user message with correct ID
            addMessage({ ...userMsg, conversation_id: newConv.id });
          } catch (err) {
            console.error("Failed to create conversation:", err);
            addToast({ type: "error", message: "Failed to start new chat." });
            setStreaming(false);
            return;
          }
        }

        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/api/v1/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message,
            conversation_id: currentConversationId,
          }),
        });

        if (!response.ok) {
          if (response.status === 401) {
            addToast({
              type: "error",
              message: "Session expired. Please login again.",
            });
          } else {
            addToast({ type: "error", message: "Failed to send message." });
          }
          throw new Error("Failed to stream response");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                continue;
              }

              try {
                const event: StreamChatResponse = JSON.parse(data);

                if (event.type === "chunk" && event.content) {
                  updateStreamingContent(event.content);
                } else if (event.type === "complete") {
                  // Save complete assistant message
                  const assistantMsg: Message = {
                    id: event.message_id || crypto.randomUUID(),
                    conversation_id: currentConversationId,
                    role: "assistant",
                    content: useChatStore.getState().streamingContent,
                    metadata: event.metadata,
                    created_at: new Date(),
                  };
                  addMessage(assistantMsg);
                  clearStreamingContent();
                } else if (event.type === "error") {
                  console.error("Stream error:", event.error);
                  addToast({
                    type: "error",
                    message: event.error || "AI Error",
                  });
                }
              } catch (e) {
                console.error("Failed to parse SSE event:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        // We already toasted above for some cases, but general catch:
        if (!useChatStore.getState().streamingContent) {
          // Only show toast if we haven't started streaming (otherwise it looks like interruption)
          // Actually, keeping existing logic of adding error message to chat is also good for context
          const errorMsg: Message = {
            id: crypto.randomUUID(),
            conversation_id: currentConversationId!,
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            created_at: new Date(),
          };
          addMessage(errorMsg);
        }
      } finally {
        setStreaming(false);
      }
    },
    [
      activeConversationId,
      addMessage,
      updateStreamingContent,
      clearStreamingContent,
      setStreaming,
      setActiveConversation,
      addConversation,
      addToast,
    ],
  );

  return { sendMessage };
}
