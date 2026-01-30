import { pool } from "../pool";
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

    const result = await pool.query<User>(
      `INSERT INTO users (email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, role, created_at, updated_at`,
      [email, password_hash, full_name, role],
    );

    return result.rows[0];
  },

  /**
   * Find user by email
   */
  async findByEmail(
    email: string,
  ): Promise<(User & { password_hash: string }) | null> {
    const result = await pool.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    return result.rows[0] || null;
  },

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    const result = await pool.query<User>(
      `SELECT id, email, full_name, role, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id],
    );

    return result.rows[0] || null;
  },

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User | null> {
    const allowedFields = ["full_name", "role"];
    const fields = Object.keys(updates).filter((key) =>
      allowedFields.includes(key),
    );

    if (fields.length === 0) {
      return this.findById(id);
    }

    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(", ");
    const values = [id, ...fields.map((field) => updates[field as keyof User])];

    const result = await pool.query<User>(
      `UPDATE users
       SET ${setClause}, updated_at = NOW()
       WHERE id = $1
       RETURNING id, email, full_name, role, created_at, updated_at`,
      values,
    );

    return result.rows[0] || null;
  },

  /**
   * Delete user
   */
  async delete(id: string): Promise<boolean> {
    const result = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);

    return result.rowCount !== null && result.rowCount > 0;
  },
};
