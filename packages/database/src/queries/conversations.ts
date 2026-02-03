import { pool } from "../pool";

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  resume_id: string | null;
  last_message_at: Date;
  created_at: Date;
  updated_at: Date;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  metadata?: Record<string, unknown>;
  created_at: Date;
}

export const conversationQueries = {
  /**
   * Create a new conversation
   */
  async create(userId: string, resumeId?: string): Promise<Conversation> {
    const result = await pool.query<Conversation>(
      `INSERT INTO conversations (user_id, resume_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, resumeId || null],
    );
    return result.rows[0];
  },

  /**
   * Get all conversations for a user (ordered by most recent)
   */
  async findByUser(userId: string, limit = 50): Promise<Conversation[]> {
    const result = await pool.query<Conversation>(
      `SELECT * FROM conversations
       WHERE user_id = $1
       ORDER BY last_message_at DESC
       LIMIT $2`,
      [userId, limit],
    );
    return result.rows;
  },

  /**
   * Get a single conversation by ID (must belong to user)
   */
  async findById(id: string, userId: string): Promise<Conversation | null> {
    const result = await pool.query<Conversation>(
      `SELECT * FROM conversations
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return result.rows[0] || null;
  },

  /**
   * Update conversation title
   */
  async updateTitle(id: string, title: string): Promise<void> {
    await pool.query(
      `UPDATE conversations
       SET title = $2, updated_at = NOW()
       WHERE id = $1`,
      [id, title],
    );
  },

  /**
   * Delete a conversation (must belong to user)
   */
  async delete(id: string, userId: string): Promise<boolean> {
    const result = await pool.query(
      `DELETE FROM conversations
       WHERE id = $1 AND user_id = $2`,
      [id, userId],
    );
    return result.rowCount !== null && result.rowCount > 0;
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
    const result = await pool.query<Message>(
      `INSERT INTO messages (conversation_id, role, content, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        conversationId,
        role,
        content,
        metadata ? JSON.stringify(metadata) : null,
      ],
    );
    return result.rows[0];
  },

  /**
   * Get all messages in a conversation
   */
  async getMessages(conversationId: string, limit = 100): Promise<Message[]> {
    const result = await pool.query<Message>(
      `SELECT * FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [conversationId, limit],
    );
    return result.rows;
  },
};
