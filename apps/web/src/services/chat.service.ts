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
    model?: string,
  ): Promise<Conversation> {
    const response = await apiClient.post<ApiResponse<Conversation>>(
      "/chat/conversations",
      {
        resume_id: resumeId,
        initial_message: initialMessage,
        model,
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

  async getThread(conversationId: string): Promise<Message[]> {
    const response = await apiClient.get<ApiResponse<Message[]>>(
      `/chat/conversations/${conversationId}/thread`,
    );
    return response.data.data || [];
  },

  async deleteConversation(id: string): Promise<void> {
    await apiClient.delete(`/chat/conversations/${id}`);
  },

  async archiveConversation(id: string): Promise<void> {
    await apiClient.patch(`/chat/conversations/${id}/archive`);
  },

  async editMessage(id: string, content: string): Promise<Message> {
    const response = await apiClient.post<ApiResponse<Message>>(
      `/chat/messages/${id}/edit`,
      { content },
    );
    return response.data.data!;
  },

  async cancelMessage(id: string): Promise<void> {
    await apiClient.post(`/chat/messages/${id}/cancel`);
  },

  async getMessageVersions(id: string): Promise<Message[]> {
    const response = await apiClient.get<ApiResponse<Message[]>>(
      `/chat/messages/${id}/versions`,
    );
    return response.data.data || [];
  },
};
