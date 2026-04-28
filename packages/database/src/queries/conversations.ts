import { eq, asc, and, desc } from "drizzle-orm";
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
      .values({ user_id: userId, resume_id: resumeId })
      .returning();

    return result as unknown as Conversation;
  },

  /**
   * Get all conversations for a user
   */
  async findByUser(userId: string, limit = 50): Promise<Conversation[]> {
    const result = await db
      .select()
      .from(conversations)
      .where(eq(conversations.user_id, userId))
      .orderBy(desc(conversations.updated_at))
      .limit(limit);

    return result as unknown as Conversation[];
  },

  /**
   * Get a single conversation by ID
   */
  async findById(id: string, userId: string): Promise<Conversation | null> {
    const [result] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.user_id, userId)));

    return (result as unknown as Conversation) || null;
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
   * Update the resume associated with a conversation
   */
  async updateResumeId(id: string, resumeId: string): Promise<void> {
    await db
      .update(conversations)
      .set({ resume_id: resumeId, updated_at: new Date() })
      .where(eq(conversations.id, id));
  },

  /**
   * Delete a conversation
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const [result] = await db
      .delete(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.user_id, userId)))
      .returning();

    return !!result;
  },

  // ─── Message Operations ──────────────────────────────────────────────────

  /**
   * Create a new message in a conversation
   */
  async createMessage(
    conversationId: string,
    role: string,
    content: string,
    tokensUsed?: number,
    metadata?: any,
  ): Promise<Message> {
    const [result] = await db
      .insert(messages)
      .values({
        conversation_id: conversationId,
        role,
        content,
        tokens_used: tokensUsed,
        metadata,
      })
      .returning();

    // Touch conversation timestamp
    await db
      .update(conversations)
      .set({ updated_at: new Date() })
      .where(eq(conversations.id, conversationId));

    return result as unknown as Message;
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, limit = 100): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.conversation_id, conversationId))
      .orderBy(asc(messages.created_at))
      .limit(limit);

    return result as unknown as Message[];
  },
};
