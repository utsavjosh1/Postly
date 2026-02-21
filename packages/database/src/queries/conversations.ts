import { eq, asc, and } from "drizzle-orm";
import { db } from "../index";
import { conversations, messages } from "../schema";
import type {
  Conversation,
  Message,
  MessageStreamStatus,
} from "@postly/shared-types";

export const conversationQueries = {
  /**
   * Create a new conversation
   */
  async create(
    userId: string,
    resumeId?: string,
    model?: string,
  ): Promise<Conversation> {
    const [result] = await db
      .insert(conversations)
      .values({ user_id: userId, resume_id: resumeId, model })
      .returning();

    return result as unknown as Conversation;
  },

  /**
   * Get all conversations for a user (most recent first, excludes archived by default)
   */
  async findByUser(
    userId: string,
    limit = 50,
    includeArchived = false,
  ): Promise<Conversation[]> {
    const conditions = [eq(conversations.user_id, userId)];
    if (!includeArchived) {
      conditions.push(eq(conversations.is_archived, false));
    }

    const result = await db
      .select()
      .from(conversations)
      .where(and(...conditions))
      .orderBy(asc(conversations.updated_at))
      .limit(limit);

    return result as unknown as Conversation[];
  },

  /**
   * Get a single conversation by ID (scoped to user)
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
   * Update conversation resume_id
   */
  async updateResumeId(id: string, resumeId: string): Promise<void> {
    await db
      .update(conversations)
      .set({ resume_id: resumeId, updated_at: new Date() })
      .where(eq(conversations.id, id));
  },

  /**
   * Archive / unarchive a conversation
   */
  async setArchived(id: string, isArchived: boolean): Promise<void> {
    await db
      .update(conversations)
      .set({ is_archived: isArchived, updated_at: new Date() })
      .where(eq(conversations.id, id));
  },

  /**
   * Delete a conversation (scoped to user)
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
    role: Message["role"],
    content: string,
    metadata?: Record<string, unknown>,
    parentMessageId?: string,
    status: MessageStreamStatus = "completed",
  ): Promise<Message> {
    const [result] = await db
      .insert(messages)
      .values({
        conversation_id: conversationId,
        role,
        content,
        metadata,
        parent_message_id: parentMessageId,
        status,
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
   * Get only the active-branch messages (what the user sees)
   */
  async getActiveThread(
    conversationId: string,
    limit = 100,
  ): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.conversation_id, conversationId),
          eq(messages.is_active, true),
        ),
      )
      .orderBy(asc(messages.created_at))
      .limit(limit);

    return result as unknown as Message[];
  },

  /**
   * Get ALL messages (including inactive branches) for tree rendering
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

  /**
   * Edit a user message → creates a new sibling version,
   * deactivates the old message and its entire subtree.
   */
  async editMessage(
    messageId: string,
    newContent: string,
    conversationId: string,
  ): Promise<Message> {
    // 1. Get the original message
    const [original] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));

    if (!original) throw new Error("Message not found");

    // 2. Deactivate ALL active messages in this conversation
    await db
      .update(messages)
      .set({ is_active: false })
      .where(
        and(
          eq(messages.conversation_id, conversationId),
          eq(messages.is_active, true),
        ),
      );

    // 3. Re-activate ancestors of the edited message (walk the parent chain)
    const allMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.conversation_id, conversationId))
      .orderBy(asc(messages.created_at));

    const messageMap = new Map(allMessages.map((m) => [m.id, m]));
    const ancestorIds = new Set<string>();
    let currentParentId = original.parent_message_id;

    while (currentParentId) {
      ancestorIds.add(currentParentId);
      const parent = messageMap.get(currentParentId);
      currentParentId = parent?.parent_message_id || null;
    }

    for (const ancestorId of ancestorIds) {
      await db
        .update(messages)
        .set({ is_active: true })
        .where(eq(messages.id, ancestorId));
    }

    // 4. Create new version as a sibling (same parent, higher version)
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversation_id: conversationId,
        role: original.role,
        content: newContent,
        parent_message_id: original.parent_message_id,
        version: original.version + 1,
        is_active: true,
        status: "completed",
      })
      .returning();

    // Touch conversation timestamp
    await db
      .update(conversations)
      .set({ updated_at: new Date() })
      .where(eq(conversations.id, conversationId));

    return newMessage as unknown as Message;
  },

  /**
   * Cancel a streaming message (user pressed "Stop generating")
   */
  async cancelMessage(messageId: string): Promise<void> {
    await db
      .update(messages)
      .set({ status: "cancelled" })
      .where(eq(messages.id, messageId));
  },

  /**
   * Update message status (streaming lifecycle)
   */
  async updateMessageStatus(
    messageId: string,
    status: MessageStreamStatus,
  ): Promise<void> {
    await db.update(messages).set({ status }).where(eq(messages.id, messageId));
  },

  /**
   * Update message content (for streamed content accumulation)
   */
  async updateMessageContent(
    messageId: string,
    content: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    const updateData: Record<string, unknown> = { content };
    if (metadata) updateData.metadata = metadata;

    await db.update(messages).set(updateData).where(eq(messages.id, messageId));
  },

  /**
   * Get all edit versions for a parent (for "edited 2/3" navigation)
   */
  async getMessageVersions(
    parentMessageId: string,
    role: string,
  ): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.parent_message_id, parentMessageId),
          eq(messages.role, role),
        ),
      )
      .orderBy(asc(messages.version));

    return result as unknown as Message[];
  },
};
