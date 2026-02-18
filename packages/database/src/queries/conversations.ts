import { eq, desc, asc, and } from "drizzle-orm";
import { db } from "../index";
import { conversations, messages } from "../schema";
import type { Conversation, Message } from "@postly/shared-types";

export const conversationQueries = {
  /**
   * Create a new conversation
   */
  async create(userId: string, resumeId?: string): Promise<Conversation> {
    const [result] = await db
      .insert(conversations)
      .values({
        user_id: userId,
        resume_id: resumeId,
      })
      .returning();
    return result as any as Conversation;
  },

  /**
   * Get all conversations for a user (ordered by most recent)
   */
  async findByUser(userId: string, limit = 50): Promise<Conversation[]> {
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.user_id, userId))
      .orderBy(desc(conversations.updated_at))
      .limit(limit);
    return result as any as Conversation[];
  },

  /**
   * Get a single conversation by ID (must belong to user)
   */
  async findById(id: string, userId: string): Promise<Conversation | null> {
    const [result] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.user_id, userId)));
    return (result as any as Conversation) || null;
  },

  /**
   * Update conversation title
   */
  async updateTitle(id: string, title: string): Promise<void> {
    await db
      .update(conversations)
      .set({ title, updated_at: new Date() })
      .where(eq(conversations.id, id));
  },

  /**
   * Update conversation resume_id
   */
  async updateResumeId(id: string, resumeId: string): Promise<void> {
    await db
      .update(conversations)
      .set({ resume_id: resumeId, updated_at: new Date() })
      .where(eq(conversations.id, id));
  },

  /**
   * Delete a conversation (must belong to user)
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const [result] = await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.user_id, userId)))
      .returning();
    return !!result;
  },

  /**
   * Create a new message in a conversation
   */
  async createMessage(
    conversationId: string,
    role: Message["role"],
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<Message> {
    const [result] = await db
      .insert(messages)
      .values({
        conversation_id: conversationId,
        role,
        content,
        metadata,
      })
      .returning();

    // Update conversation timestamp
    await db
      .update(conversations)
      .set({ updated_at: new Date() })
      .where(eq(conversations.id, conversationId));

    return result as any as Message;
  },

  /**
   * Get all messages in a conversation
   */
  async getMessages(conversationId: string, limit = 100): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.conversation_id, conversationId))
      .orderBy(asc(messages.created_at))
      .limit(limit);
    return result as any as Message[];
  },
};
