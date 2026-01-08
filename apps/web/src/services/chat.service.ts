import { apiClient } from "../lib/api-client";
import type { Conversation, Message, ApiResponse } from "@postly/shared-types";

export const chatService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<ApiResponse<Conversation[]>>(
      "/chat/conversations",
    );
    return response.data.data || [];
  },

  async createConversation(
    resumeId?: string,
    initialMessage?: string,
  ): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<Conversation>>(
      "/chat/conversations",
      {
        resume_id: resumeId,
        initial_message: initialMessage,
      },
    );
    return response.data.data!;
  },

  async getConversation(
    id: string,
  ): Promise<{ conversation: Conversation; messages: Message[] }> {
    const response = await apiClient.get<
      ApiResponse<{ conversation: Conversation; messages: Message[] }>
    >(`/chat/conversations/${id}`);
    return response.data.data!;
  },

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/chat/conversations/${id}`);
  },
};
