import { useCallback } from "react";
import { useChatStore } from "../stores/chat.store";
import type { StreamChatResponse, Message } from "@postly/shared-types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function useSSEChat() {
  const {
    activeConversationId,
    addMessage,
    updateStreamingContent,
    clearStreamingContent,
    setStreaming,
  } = useChatStore();

  const sendMessage = useCallback(
    async (message: string) => {
      if (!activeConversationId) return;

      // Add user message immediately for optimistic UI
      const userMsg: Message = {
        id: crypto.randomUUID(),
        conversation_id: activeConversationId,
        role: "user",
        content: message,
        created_at: new Date(),
      };
      addMessage(userMsg);

      setStreaming(true);
      clearStreamingContent();

      try {
        const token = localStorage.getItem("access_token");
        const response = await fetch(`${API_URL}/api/v1/chat/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message,
            conversation_id: activeConversationId,
          }),
        });

        if (!response.ok) {
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
                    conversation_id: activeConversationId,
                    role: "assistant",
                    content: useChatStore.getState().streamingContent,
                    metadata: event.metadata,
                    created_at: new Date(),
                  };
                  addMessage(assistantMsg);
                  clearStreamingContent();
                } else if (event.type === "error") {
                  console.error("Stream error:", event.error);
                  // Show error message
                  const errorMsg: Message = {
                    id: crypto.randomUUID(),
                    conversation_id: activeConversationId,
                    role: "assistant",
                    content: `Error: ${event.error || "Something went wrong"}`,
                    created_at: new Date(),
                  };
                  addMessage(errorMsg);
                }
              } catch (e) {
                console.error("Failed to parse SSE event:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error);
        // Add error message
        const errorMsg: Message = {
          id: crypto.randomUUID(),
          conversation_id: activeConversationId,
          role: "assistant",
          content: "Failed to send message. Please try again.",
          created_at: new Date(),
        };
        addMessage(errorMsg);
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
    ],
  );

  return { sendMessage };
}
