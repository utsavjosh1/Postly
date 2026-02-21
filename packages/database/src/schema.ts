import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  jsonb,
  integer,
  decimal,
  vector,
  index,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }),
    full_name: varchar("full_name", { length: 255 }),
    avatar_url: text("avatar_url"),
    role: varchar("role", { length: 50 }).notNull().default("job_seeker"),
    is_verified: boolean("is_verified").default(false),

    // Forgot-password flow
    password_reset_token: varchar("password_reset_token", { length: 255 }),
    password_reset_expires_at: timestamp("password_reset_expires_at", {
      withTimezone: true,
    }),

    last_login_at: timestamp("last_login_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    roleIdx: index("idx_users_role").on(table.role),
    resetTokenIdx: index("idx_users_reset_token").on(
      table.password_reset_token,
    ),
  }),
);

export const usersRelations = relations(users, ({ many }) => ({
  resumes: many(resumes),
  conversations: many(conversations),
  job_matches: many(job_matches),
}));

// ─── Resumes ─────────────────────────────────────────────────────────────────

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    file_url: text("file_url").notNull(),
    parsed_text: text("parsed_text"),
    embedding: vector("embedding", { dimensions: 768 }),
    skills: jsonb("skills"),
    experience_years: integer("experience_years"),
    education: jsonb("education"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_resumes_user").on(table.user_id),
  }),
);

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.user_id],
    references: [users.id],
  }),
}));

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 500 }).notNull(),
    company_name: varchar("company_name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    location: varchar("location", { length: 255 }),
    salary_min: decimal("salary_min", { precision: 10, scale: 2 }),
    salary_max: decimal("salary_max", { precision: 10, scale: 2 }),
    job_type: varchar("job_type", { length: 50 }),
    remote: boolean("remote").default(false),
    source: varchar("source", { length: 100 }).notNull(),
    source_url: text("source_url"),
    embedding: vector("embedding", { dimensions: 768 }),
    skills_required: jsonb("skills_required"),
    experience_required: varchar("experience_required", { length: 100 }),
    posted_at: timestamp("posted_at", { withTimezone: true }),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    is_active: boolean("is_active").default(true),
    employer_id: uuid("employer_id").references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    companyIdx: index("idx_jobs_company").on(table.company_name),
    locationIdx: index("idx_jobs_location").on(table.location),
    remoteIdx: index("idx_jobs_remote").on(table.remote),
    jobTypeIdx: index("idx_jobs_type").on(table.job_type),
  }),
);

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  employer: one(users, {
    fields: [jobs.employer_id],
    references: [users.id],
  }),
  matches: many(job_matches),
}));

// ─── Job Matches ─────────────────────────────────────────────────────────────

export const job_matches = pgTable(
  "job_matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resume_id: uuid("resume_id")
      .notNull()
      .references(() => resumes.id, { onDelete: "cascade" }),
    job_id: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    match_score: decimal("match_score", { precision: 5, scale: 2 }).notNull(),
    ai_explanation: text("ai_explanation"),
    is_saved: boolean("is_saved").default(false),
    applied: boolean("applied").default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_job_matches_user").on(
      table.user_id,
      table.match_score,
    ),
    jobIdIdx: index("idx_job_matches_job").on(table.job_id),
    uniqueMatch: unique().on(table.user_id, table.job_id),
  }),
);

export const jobMatchesRelations = relations(job_matches, ({ one }) => ({
  user: one(users, {
    fields: [job_matches.user_id],
    references: [users.id],
  }),
  resume: one(resumes, {
    fields: [job_matches.resume_id],
    references: [resumes.id],
  }),
  job: one(jobs, {
    fields: [job_matches.job_id],
    references: [jobs.id],
  }),
}));

// ─── Conversations ───────────────────────────────────────────────────────────

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    resume_id: uuid("resume_id").references(() => resumes.id),

    /** AI model used for this conversation (e.g. "gpt-4o", "gpt-4o-mini") */
    model: varchar("model", { length: 100 }),

    /** Soft-archive — hides from list without deleting */
    is_archived: boolean("is_archived").default(false),

    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_conversations_user").on(
      table.user_id,
      table.updated_at,
    ),
    archivedIdx: index("idx_conversations_archived").on(
      table.user_id,
      table.is_archived,
    ),
  }),
);

export const conversationsRelations = relations(
  conversations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [conversations.user_id],
      references: [users.id],
    }),
    resume: one(resumes, {
      fields: [conversations.resume_id],
      references: [resumes.id],
    }),
    messages: many(messages),
  }),
);

// ─── Messages (with branching / editing support) ─────────────────────────────
//
// Tree structure for ChatGPT-style editing:
//   • parent_message_id → which message this is a reply to (forms a tree)
//   • version           → edit version (v1, v2, … for the same parent)
//   • is_active         → only the active branch is shown to the user
//   • status            → tracks streaming lifecycle & cancellation
//

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversation_id: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull(), // user | assistant | system | tool

    content: text("content").notNull(),
    metadata: jsonb("metadata"),

    /** Self-referencing FK — forms a message tree for branching */
    parent_message_id: uuid("parent_message_id"),

    /** Edit version number. Editing creates a sibling with version + 1. */
    version: integer("version").notNull().default(1),

    /** Only the active branch is rendered in the UI */
    is_active: boolean("is_active").notNull().default(true),

    /**
     * Streaming lifecycle status:
     *   sending → streaming → completed
     *                       → cancelled  (user stopped generation)
     *                       → error      (AI error)
     */
    status: varchar("status", { length: 20 }).notNull().default("completed"),

    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    conversationIdIdx: index("idx_messages_conversation").on(
      table.conversation_id,
      table.created_at,
    ),
    parentIdx: index("idx_messages_parent").on(table.parent_message_id),
    activeIdx: index("idx_messages_active").on(
      table.conversation_id,
      table.is_active,
    ),
  }),
);

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversation_id],
    references: [conversations.id],
  }),
  parent: one(messages, {
    fields: [messages.parent_message_id],
    references: [messages.id],
    relationName: "message_parent",
  }),
  children: many(messages, { relationName: "message_parent" }),
  attachments: many(message_attachments),
}));

// ─── Message Attachments ─────────────────────────────────────────────────────

export const message_attachments = pgTable(
  "message_attachments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    message_id: uuid("message_id")
      .notNull()
      .references(() => messages.id, { onDelete: "cascade" }),
    file_url: text("file_url").notNull(),
    file_name: varchar("file_name", { length: 255 }).notNull(),
    file_type: varchar("file_type", { length: 100 }),
    file_size: integer("file_size"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    messageIdIdx: index("idx_attachments_message").on(table.message_id),
  }),
);

export const messageAttachmentsRelations = relations(
  message_attachments,
  ({ one }) => ({
    message: one(messages, {
      fields: [message_attachments.message_id],
      references: [messages.id],
    }),
  }),
);
