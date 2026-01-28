import { useCallback, useRef } from "react";
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
    setConversationState,
  } = useChatStore();

  const abortControllerRef = useRef<AbortController | null>(null);

  const { addToast } = useToastStore();

  const sendMessage = useCallback(
    async (message: string) => {
      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      let currentConversationId = activeConversationId;

      // OPTIMISTIC UI: Add user message immediately
      const tempUserMsgId = crypto.randomUUID();
      const userMsg: Message = {
        id: tempUserMsgId,
        conversation_id: currentConversationId || "temp", // Placeholder if no ID yet
        role: "user",
        content: message,
        created_at: new Date(),
        status: "sending",
      };

      // If we have a conversation, add message now.
      // If NOT, we wait until we have the ID so the store state is consistent.
      if (currentConversationId) {
        addMessage(userMsg);
      }

      setStreaming(true);
      setConversationState("thinking");
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
            addMessage({
              ...userMsg,
              conversation_id: newConv.id,
              status: "sent",
            });

            // Also update the optimistic message status if it was added?
            // The store logic above adds it only if currentConversationId existed.
            // If it didn't, we add it now.
          } catch (err) {
            console.error("Failed to create conversation:", err);
            addToast({ type: "error", message: "Failed to start new chat." });
            setStreaming(false);
            setConversationState("error");
            return;
          }
        } else {
          // Update status of optimistic message
          // In a real app we'd update the message by ID.
          // For now we assume optimistic update was "good enough" or we trigger a re-fetch.
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
          signal: abortController.signal,
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
                  // Ensure state is streaming once we get first chunk
                  useChatStore.getState().setConversationState("streaming");
                } else if (event.type === "complete") {
                  // Save complete assistant message
                  const assistantMsg: Message = {
                    id: event.message_id || crypto.randomUUID(),
                    conversation_id: currentConversationId,
                    role: "assistant",
                    content: useChatStore.getState().streamingContent,
                    metadata: event.metadata,
                    created_at: new Date(),
                    status: "delivered",
                  };
                  addMessage(assistantMsg);
                  clearStreamingContent();
                  setConversationState("completed");
                } else if (event.type === "error") {
                  console.error("Stream error:", event.error);
                  addToast({
                    type: "error",
                    message: event.error || "AI Error",
                  });
                  setConversationState("error");
                }
              } catch (e) {
                console.error("Failed to parse SSE event:", e);
              }
            }
          }
        }
      } catch (error: any) {
        if (error.name === "AbortError") {
          setConversationState("interrupted");
        } else {
          console.error("Failed to send message:", error);
          // We already toasted above for some cases, but general catch:
          if (!useChatStore.getState().streamingContent) {
            const errorMsg: Message = {
              id: crypto.randomUUID(),
              conversation_id: currentConversationId!,
              role: "assistant",
              content: "Sorry, I encountered an error. Please try again.",
              created_at: new Date(),
              status: "error",
            };
            addMessage(errorMsg);
          }
          setConversationState("error");
        }
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
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
      setConversationState,
    ],
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setConversationState("interrupted");
      setStreaming(false);
    }
  }, [setConversationState, setStreaming]);

  return { sendMessage, stopGeneration };
}
