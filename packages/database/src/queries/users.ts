import { eq } from "drizzle-orm";
import { db } from "../index";
import { users } from "../schema";
import type { User, UserRole } from "@postly/shared-types";

interface CreateUserDbInput {
  email: string;
  password_hash: string;
  full_name?: string;
  role?: UserRole;
}

export const userQueries = {
  /**
   * Create a new user
   */
  async create(input: CreateUserDbInput): Promise<User> {
    const { email, password_hash, full_name, role = "job_seeker" } = input;

    const [result] = await db
      .insert(users)
      .values({
        email,
        password_hash,
        full_name,
        role,
      })
      .returning({
        id: users.id,
        email: users.email,
        full_name: users.full_name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    return result as any as User;
  },

  /**
   * Find user by email
   */
  async findByEmail(
    email: string,
  ): Promise<(User & { password_hash: string }) | null> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));

    return (result as any as User & { password_hash: string }) || null;
  },

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const [result] = await db
      .select({
        id: users.id,
        email: users.email,
        full_name: users.full_name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      })
      .from(users)
      .where(eq(users.id, id));

    return (result as any as User) || null;
  },

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const allowedFields = ["full_name", "role"];
    const updateData: Record<string, any> = {};

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key as keyof User];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return this.findById(id);
    }

    const [result] = await db
      .update(users)
      .set({
        ...updateData,
        updated_at: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        full_name: users.full_name,
        role: users.role,
        created_at: users.created_at,
        updated_at: users.updated_at,
      });

    return (result as any as User) || null;
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
};
