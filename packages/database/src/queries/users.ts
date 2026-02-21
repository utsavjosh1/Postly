import { eq } from "drizzle-orm";
import { db } from "../index";
import { users } from "../schema";
import type { User, CreateUserDbInput } from "@postly/shared-types";

export const userQueries = {
  /**
   * Create a new user
   */
  async create(input: CreateUserDbInput): Promise<User> {
    const { email, password_hash, full_name, role = "job_seeker" } = input;

    const [result] = await db
      .insert(users)
      .values({ email, password_hash, full_name, role })
      .returning();

    return result as unknown as User;
  },

  /**
   * Find user by email (includes password_hash for auth)
   */
  async findByEmail(
    email: string,
  ): Promise<(User & { password_hash: string }) | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return (result as unknown as User & { password_hash: string }) || null;
  },

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const [result] = await db.select().from(users).where(eq(users.id, id));

    return (result as unknown as User) || null;
  },

  /**
   * Update user profile fields
   */
  async update(
    id: string,
    updates: Partial<Pick<User, "full_name" | "role">>,
  ): Promise<User | null> {
    if (Object.keys(updates).length === 0) {
      return this.findById(id);
    }

    const [result] = await db
      .update(users)
      .set({
        ...updates,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning();

    return (result as unknown as User) || null;
  },

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const [result] = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ id: users.id });

    return !!result;
  },

  // ─── Forgot-Password Flow ──────────────────────────────────────────────

  /**
   * Store a password-reset token and expiry for the user.
   */
  async setResetToken(
    email: string,
    token: string,
    expiresAt: Date,
  ): Promise<boolean> {
    const [result] = await db
      .update(users)
      .set({
        password_reset_token: token,
        password_reset_expires_at: expiresAt,
        updated_at: new Date(),
      })
      .where(eq(users.email, email))
      .returning({ id: users.id });

    return !!result;
  },

  /**
   * Find a user by their password-reset token (returns null if expired).
   */
  async findByResetToken(token: string): Promise<User | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.password_reset_token, token));

    if (!result) return null;

    // Check expiry
    if (
      result.password_reset_expires_at &&
      new Date(result.password_reset_expires_at) < new Date()
    ) {
      return null;
    }

    return result as unknown as User;
  },

  /**
   * Reset password and clear the reset token.
   */
  async resetPassword(
    token: string,
    newPasswordHash: string,
  ): Promise<boolean> {
    const user = await this.findByResetToken(token);
    if (!user) return false;

    const [result] = await db
      .update(users)
      .set({
        password_hash: newPasswordHash,
        password_reset_token: null,
        password_reset_expires_at: null,
        updated_at: new Date(),
      })
      .where(eq(users.id, user.id))
      .returning({ id: users.id });

    return !!result;
  },

  /**
   * Update last login timestamp
   */
  async updateLastLogin(id: string): Promise<void> {
    await db
      .update(users)
      .set({ last_login_at: new Date(), updated_at: new Date() })
      .where(eq(users.id, id));
  },
};
