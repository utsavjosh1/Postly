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

// Users table
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }),
    google_id: varchar("google_id", { length: 255 }).unique(),
    full_name: varchar("full_name", { length: 255 }),
    avatar_url: text("avatar_url"),
    role: varchar("role", { length: 50 }).notNull().default("job_seeker"),
    is_verified: boolean("is_verified").default(false),
    last_login_at: timestamp("last_login_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    roleIdx: index("idx_users_role").on(table.role),
    googleIdIdx: index("idx_users_google_id").on(table.google_id),
  }),
);

// Resumes table
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
    // Vector index cannot be fully defined in Drizzle generic schema yet without raw SQL
  }),
);

// Jobs table
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

// Job Matches table
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

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    // Resume ID was missing in schema.sql but present in queries
    // I'll add it here as it was likely added later
    resume_id: uuid("resume_id").references(() => resumes.id),
  },
  (table) => ({
    userIdIdx: index("idx_conversations_user").on(
      table.user_id,
      table.updated_at,
    ),
  }),
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    conversation_id: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    conversationIdIdx: index("idx_messages_conversation").on(
      table.conversation_id,
      table.created_at,
    ),
  }),
);
