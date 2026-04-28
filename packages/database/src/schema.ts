import {
  pgTable,
  pgEnum,
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

// ─── Enums ────────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
  "job_seeker",
  "employer",
  "admin",
  "discord_owner",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "applied",
  "under_review",
  "phone_screen",
  "interviewed",
  "offer_extended",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "past_due",
  "trialing",
  "paused",
  "expired",
]);

export const subscriptionPlanEnum = pgEnum("subscription_plan", [
  "seeker",
  "employer",
  "discord_owner",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "succeeded",
  "failed",
  "refunded",
  "disputed",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "pending",
  "sent",
  "failed",
  "bounced",
  "opened",
]);

export const botPlatformEnum = pgEnum("bot_platform", [
  "discord",
  "reddit",
  "twitter",
]);

// ─── Users & Auth ─────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    password_hash: varchar("password_hash", { length: 255 }),
    full_name: varchar("full_name", { length: 255 }),
    avatar_url: text("avatar_url"),
    roles: userRoleEnum("roles").array().notNull().default(["job_seeker"]),
    is_verified: boolean("is_verified").default(false),
    timezone: varchar("timezone", { length: 50 }),
    locale: varchar("locale", { length: 20 }),
    password_reset_token: varchar("password_reset_token", { length: 255 }),
    password_reset_expires_at: timestamp("password_reset_expires_at", {
      withTimezone: true,
    }),
    last_login_at: timestamp("last_login_at", { withTimezone: true }),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    rolesIdx: index("idx_users_role").on(table.roles),
  }),
);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token_hash: varchar("token_hash", { length: 255 }).notNull().unique(),
  ip_address: varchar("ip_address", { length: 45 }),
  user_agent: text("user_agent"),
  last_active_at: timestamp("last_active_at", {
    withTimezone: true,
  }).defaultNow(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const otp_codes = pgTable(
  "otp_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    code_hash: varchar("code_hash", { length: 255 }).notNull(),
    expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
    attempts: integer("attempts").default(0).notNull(),
    last_attempt_at: timestamp("last_attempt_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdIdx: index("idx_otp_user").on(table.user_id),
  }),
);

// ─── Profiles ─────────────────────────────────────────────────────────────────

export const seeker_profiles = pgTable(
  "seeker_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    headline: varchar("headline", { length: 500 }),
    summary: text("summary"),
    skills: jsonb("skills"),
    experience_years: integer("experience_years"),
    experience_level: varchar("experience_level", { length: 50 }),
    education: jsonb("education"),
    certifications: jsonb("certifications"),
    languages: jsonb("languages"),
    work_history: jsonb("work_history"),
    desired_job_titles: jsonb("desired_job_titles"),
    desired_locations: jsonb("desired_locations"),
    desired_salary_min: decimal("desired_salary_min", {
      precision: 10,
      scale: 2,
    }),
    desired_salary_max: decimal("desired_salary_max", {
      precision: 10,
      scale: 2,
    }),
    desired_job_type: varchar("desired_job_type", { length: 50 }),
    open_to_remote: boolean("open_to_remote").default(true),
    open_to_relocation: boolean("open_to_relocation").default(false),
    embedding: vector("embedding", { dimensions: 1024 }),
    prompt_history_summary: text("prompt_history_summary"),
    last_parsed_at: timestamp("last_parsed_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("idx_seeker_profiles_user").on(table.user_id),
  }),
);

export const employer_profiles = pgTable(
  "employer_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    company_name: varchar("company_name", { length: 255 }).notNull(),
    company_website: text("company_website"),
    company_logo_url: text("company_logo_url"),
    company_description: text("company_description"),
    company_size: varchar("company_size", { length: 50 }),
    industry: varchar("industry", { length: 150 }),
    headquarters_location: varchar("headquarters_location", { length: 255 }),
    social_links: jsonb("social_links"),
    embedding: vector("embedding", { dimensions: 1024 }),
    active_job_count: integer("active_job_count").default(0),
    is_verified: boolean("is_verified").default(false),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("idx_employer_profiles_user").on(table.user_id),
  }),
);

// ─── Resumes & Jobs ───────────────────────────────────────────────────────────

export const resumes = pgTable(
  "resumes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    file_url: text("file_url").notNull(),
    parsed_text: text("parsed_text"),
    embedding: vector("embedding", { dimensions: 1024 }),
    skills: jsonb("skills"),
    experience_years: integer("experience_years"),
    education: jsonb("education"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("idx_resumes_user").on(table.user_id),
  }),
);

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
    source: varchar("source", { length: 100 }).notNull(), // 'internal' or origin (e.g. 'indeed')
    source_url: text("source_url"),
    embedding: vector("embedding", { dimensions: 1024 }),
    skills_required: jsonb("skills_required"),
    experience_required: varchar("experience_required", { length: 100 }),
    posted_at: timestamp("posted_at", { withTimezone: true }),
    expires_at: timestamp("expires_at", { withTimezone: true }),
    is_active: boolean("is_active").default(true),
    employer_id: uuid("employer_id").references(() => users.id), // Nullable for scraped jobs
    external_job_id: varchar("external_job_id", { length: 255 }),
    fingerprint: varchar("fingerprint", { length: 64 }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    companyIdx: index("idx_jobs_company").on(table.company_name),
    activeIdx: index("idx_jobs_active").on(table.is_active),
  }),
);

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
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    uniqueMatch: unique().on(table.user_id, table.job_id),
  }),
);

// ─── Applications ─────────────────────────────────────────────────────────────
// ONLY for jobs generated on our platform (where employer_id is NOT NULL)

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seeker_id: uuid("seeker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    job_id: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    resume_id: uuid("resume_id").references(() => resumes.id),
    status: applicationStatusEnum("status").notNull().default("applied"),
    cover_letter: text("cover_letter"),
    applied_at: timestamp("applied_at", { withTimezone: true }).defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    seekerJobUnique: unique().on(table.seeker_id, table.job_id),
  }),
);

export const application_status_history = pgTable(
  "application_status_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    application_id: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    from_status: applicationStatusEnum("from_status"),
    to_status: applicationStatusEnum("to_status").notNull(),
    changed_by: uuid("changed_by").references(() => users.id),
    note: text("note"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
);

// ─── AI Conversations ─────────────────────────────────────────────────────────

export const system_prompts = pgTable("system_prompts", {
  id: uuid("id").primaryKey().defaultRandom(),
  version: integer("version").notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  content: text("content").notNull(),
  is_active: boolean("is_active").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  resume_id: uuid("resume_id").references(() => resumes.id),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversation_id: uuid("conversation_id")
    .notNull()
    .references(() => conversations.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 50 }).notNull(),
  content: text("content").notNull(),
  tokens_used: integer("tokens_used"),
  metadata: jsonb("metadata"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Bots & Social ────────────────────────────────────────────────────────────

export const bot_configs = pgTable(
  "bot_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: botPlatformEnum("platform").notNull(),

    // Detailed Configuration
    is_active: boolean("is_active").default(true),

    // Platform Auth (Stored as JSON for flexibility, or encrypted)
    credentials: jsonb("credentials"),

    // Target Destination (e.g. Channel ID for Discord, Subreddit for Reddit)
    target_id: varchar("target_id", { length: 255 }),
    target_name: varchar("target_name", { length: 255 }),
    webhook_url: text("webhook_url"),

    // Filtering Details: "What type of jobs they want"
    filter_keywords: varchar("filter_keywords", { length: 500 }), // comma separated
    filter_locations: varchar("filter_locations", { length: 500 }),
    filter_min_salary: decimal("filter_min_salary", {
      precision: 10,
      scale: 2,
    }),
    filter_job_types: varchar("filter_job_types", { length: 255 }).array(),

    last_post_at: timestamp("last_post_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userPlatformUnique: unique().on(t.user_id, t.platform),
  }),
);

export const bot_posts = pgTable("bot_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  bot_config_id: uuid("bot_config_id")
    .notNull()
    .references(() => bot_configs.id, { onDelete: "cascade" }),
  job_id: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
  external_post_id: varchar("external_post_id", { length: 255 }),
  status: varchar("status", { length: 30 }).default("sent"),
  error_message: text("error_message"),
  posted_at: timestamp("posted_at", { withTimezone: true }).defaultNow(),
});

// ─── Billing ──────────────────────────────────────────────────────────────────

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: subscriptionPlanEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull().default("active"),
  dodo_subscription_id: varchar("dodo_subscription_id", {
    length: 255,
  }).unique(),
  dodo_customer_id: varchar("dodo_customer_id", { length: 255 }),
  current_period_end: timestamp("current_period_end", { withTimezone: true }),
  raw_data: jsonb("raw_data"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  subscription_id: uuid("subscription_id").references(() => subscriptions.id),
  dodo_payment_id: varchar("dodo_payment_id", { length: 255 }),
  dodo_customer_id: varchar("dodo_customer_id", { length: 255 }),
  event_type: varchar("event_type", { length: 100 }),
  amount: integer("amount").notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("USD"),
  status: paymentStatusEnum("status").notNull(),
  paid_at: timestamp("paid_at", { withTimezone: true }),
  raw_payload: jsonb("raw_payload"),
  idempotency_key: varchar("idempotency_key", { length: 255 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Notifications ────────────────────────────────────────────────────────────

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 100 }), // e.g. 'job_alert', 'welcome'
  subject: varchar("subject", { length: 500 }).notNull(),
  content: text("content").notNull(), // HTML or Text body
  to_email: varchar("to_email", { length: 255 }).notNull(),
  status: notificationStatusEnum("status").notNull().default("pending"),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  error_message: text("error_message"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── System ───────────────────────────────────────────────────────────────────

export const audit_log = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor_id: uuid("actor_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entity_type: varchar("entity_type", { length: 100 }),
  entity_id: uuid("entity_id"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const token_usage = pgTable(
  "token_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    window_start: timestamp("window_start", { withTimezone: true }).notNull(),
    tokens_used: integer("tokens_used").notNull().default(0),
  },
  (table) => ({
    uniqueWindow: unique().on(table.user_id, table.window_start),
  }),
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ one, many }) => ({
  resumes: many(resumes),
  conversations: many(conversations),
  job_matches: many(job_matches),
  employer_profile: one(employer_profiles, {
    fields: [users.id],
    references: [employer_profiles.user_id],
  }),
  seeker_profile: one(seeker_profiles, {
    fields: [users.id],
    references: [seeker_profiles.user_id],
  }),
  applications: many(applications),
  subscription: one(subscriptions, {
    fields: [users.id],
    references: [subscriptions.user_id],
  }),
  payments: many(payments),
  sessions: many(sessions),
  bot_configs: many(bot_configs),
  notifications: many(notifications),
  audit_logs: many(audit_log),
  token_usage: many(token_usage),
}));

export const seekerProfilesRelations = relations(
  seeker_profiles,
  ({ one }) => ({
    user: one(users, {
      fields: [seeker_profiles.user_id],
      references: [users.id],
    }),
  }),
);

export const employerProfilesRelations = relations(
  employer_profiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [employer_profiles.user_id],
      references: [users.id],
    }),
    jobs: many(jobs),
  }),
);

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  employer: one(users, {
    fields: [jobs.employer_id],
    references: [users.id],
  }),
  matches: many(job_matches),
  applications: many(applications),
}));

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

export const applicationsRelations = relations(
  applications,
  ({ one, many }) => ({
    seeker: one(users, {
      fields: [applications.seeker_id],
      references: [users.id],
    }),
    job: one(jobs, {
      fields: [applications.job_id],
      references: [jobs.id],
    }),
    resume: one(resumes, {
      fields: [applications.resume_id],
      references: [resumes.id],
    }),
    status_history: many(application_status_history),
  }),
);

export const applicationStatusHistoryRelations = relations(
  application_status_history,
  ({ one }) => ({
    application: one(applications, {
      fields: [application_status_history.application_id],
      references: [applications.id],
    }),
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

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversation_id],
    references: [conversations.id],
  }),
}));

export const botConfigsRelations = relations(bot_configs, ({ one, many }) => ({
  user: one(users, {
    fields: [bot_configs.user_id],
    references: [users.id],
  }),
  posts: many(bot_posts),
}));

export const botPostsRelations = relations(bot_posts, ({ one }) => ({
  config: one(bot_configs, {
    fields: [bot_posts.bot_config_id],
    references: [bot_configs.id],
  }),
  job: one(jobs, {
    fields: [bot_posts.job_id],
    references: [jobs.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.user_id],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.user_id],
    references: [users.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscription_id],
    references: [subscriptions.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.user_id],
    references: [users.id],
  }),
}));
