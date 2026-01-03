import { create } from 'zustand';
import type { Conversation, Message } from '@postly/shared-types';

interface ChatState {
  // Sidebar state
  conversations: Conversation[];
  activeConversationId: string | null;
  isSidebarOpen: boolean;

  // Active conversation
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;

  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateStreamingContent: (content: string) => void;
  clearStreamingContent: () => void;

  setLoading: (loading: boolean) => void;
  setStreaming: (streaming: boolean) => void;
  toggleSidebar: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  isSidebarOpen: true,
  messages: [],
  isLoading: false,
  isStreaming: false,
  streamingContent: '',

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  setActiveConversation: (id) =>
    set({
      activeConversationId: id,
      messages: [],
      streamingContent: '',
    }),

  deleteConversation: (id) =>
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
    })),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateStreamingContent: (content) =>
    set((state) => ({
      streamingContent: state.streamingContent + content,
    })),

  clearStreamingContent: () => set({ streamingContent: '' }),

  setLoading: (loading) => set({ isLoading: loading }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}));
