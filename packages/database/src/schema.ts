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
  "free",
  "seeker",
  "employer",
  "enterprise",
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

export const integrationProviderEnum = pgEnum("integration_provider", [
  "greenhouse",
  "lever",
  "workday",
  "bamboohr",
  "linkedin",
  "indeed",
  "custom",
]);

// ─── Users ────────────────────────────────────────────────────────────────────
// Base auth table for all user types (job_seeker, employer, admin).

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

// ─── Discord ──────────────────────────────────────────────────────────────────
// Discord guild/channel configuration linked to a user.

export const discord_configs = pgTable(
  "discord_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    guild_id: varchar("guild_id", { length: 255 }).notNull().unique(),
    channel_id: varchar("channel_id", { length: 255 }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    guildIdx: index("idx_discord_guild").on(table.guild_id),
    userIdIdx: index("idx_discord_user").on(table.user_id),
  }),
);

// ─── Resumes ──────────────────────────────────────────────────────────────────
// Raw resume files plus parsed content and vector embedding for AI search.

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
  },
  (table) => ({
    userIdIdx: index("idx_resumes_user").on(table.user_id),
  }),
);

// ─── Jobs ─────────────────────────────────────────────────────────────────────
// Job postings from employers or imported from external sources.

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
    embedding: vector("embedding", { dimensions: 1024 }),
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

// ─── Job Matches ──────────────────────────────────────────────────────────────
// AI-generated match scores between a seeker's resume and a job posting.

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

// ─── Employer Profiles ────────────────────────────────────────────────────────
// Extended company details for users with role = 'employer'.

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
  },
  (table) => ({
    userIdIdx: index("idx_employer_profiles_user").on(table.user_id),
    companyNameIdx: index("idx_employer_profiles_company").on(
      table.company_name,
    ),
    industryIdx: index("idx_employer_profiles_industry").on(table.industry),
  }),
);

// ─── Seeker Profiles ──────────────────────────────────────────────────────────
// Extended profile for job seekers with parsed resume data, preferences, and
// a vector embedding for natural-language job matching and email alerts.

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
  },
  (table) => ({
    userIdIdx: index("idx_seeker_profiles_user").on(table.user_id),
    experienceLevelIdx: index("idx_seeker_profiles_level").on(
      table.experience_level,
    ),
    jobTypeIdx: index("idx_seeker_profiles_job_type").on(
      table.desired_job_type,
    ),
  }),
);

// ─── Applications ─────────────────────────────────────────────────────────────
// Tracks every job application submitted by a seeker, including full status
// lifecycle and a JSONB audit trail of every status change.

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
    status_history: jsonb("status_history").notNull().default([]),
    cover_letter: text("cover_letter"),
    notes: text("notes"),
    external_url: text("external_url"),
    contact_info: jsonb("contact_info"),
    next_interview_at: timestamp("next_interview_at", { withTimezone: true }),
    offer_details: jsonb("offer_details"),
    match_score: decimal("match_score", { precision: 5, scale: 2 }),
    ai_explanation: text("ai_explanation"),
    applied_at: timestamp("applied_at", { withTimezone: true }).defaultNow(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    seekerStatusIdx: index("idx_applications_seeker_status").on(
      table.seeker_id,
      table.status,
    ),
    jobPipelineIdx: index("idx_applications_job_pipeline").on(
      table.job_id,
      table.created_at,
    ),
    seekerJobUnique: unique().on(table.seeker_id, table.job_id),
  }),
);

// ─── Career Site Integrations ─────────────────────────────────────────────────
// Employer-owned OAuth/API connections to external job boards for job import sync.

export const career_site_integrations = pgTable(
  "career_site_integrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employer_id: uuid("employer_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: integrationProviderEnum("provider").notNull(),
    label: varchar("label", { length: 255 }),
    access_token: text("access_token"),
    refresh_token: text("refresh_token"),
    token_expires_at: timestamp("token_expires_at", { withTimezone: true }),
    api_key: text("api_key"),
    provider_config: jsonb("provider_config"),
    is_active: boolean("is_active").default(true),
    sync_interval_minutes: integer("sync_interval_minutes").default(60),
    last_synced_at: timestamp("last_synced_at", { withTimezone: true }),
    next_sync_at: timestamp("next_sync_at", { withTimezone: true }),
    last_sync_job_count: integer("last_sync_job_count").default(0),
    last_sync_error: text("last_sync_error"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    employerIdx: index("idx_integrations_employer").on(table.employer_id),
    syncQueueIdx: index("idx_integrations_sync_queue").on(
      table.is_active,
      table.next_sync_at,
    ),
    employerProviderUnique: unique().on(table.employer_id, table.provider),
  }),
);

// ─── Conversations ────────────────────────────────────────────────────────────
// Chat sessions between a user and the AI, optionally grounded to a resume.

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }),
    resume_id: uuid("resume_id").references(() => resumes.id),
    model: varchar("model", { length: 100 }),
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

// ─── Messages ─────────────────────────────────────────────────────────────────
// Individual messages within a conversation. Supports branching via parent_message_id
// and edit versioning; only the active branch is rendered to the user.

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
    parent_message_id: uuid("parent_message_id"),
    version: integer("version").notNull().default(1),
    is_active: boolean("is_active").notNull().default(true),
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

// ─── Message Attachments ──────────────────────────────────────────────────────
// Files uploaded alongside a message (e.g. resumes, documents).

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

// ─── Subscriptions ────────────────────────────────────────────────────────────
// DodoPayments subscription record per user. Controls plan access and feature gating.

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    plan: subscriptionPlanEnum("plan").notNull().default("free"),
    status: subscriptionStatusEnum("status").notNull().default("active"),
    dodo_customer_id: varchar("dodo_customer_id", { length: 255 }),
    dodo_subscription_id: varchar("dodo_subscription_id", {
      length: 255,
    }).unique(),
    dodo_product_id: varchar("dodo_product_id", { length: 255 }),
    current_period_start: timestamp("current_period_start", {
      withTimezone: true,
    }),
    current_period_end: timestamp("current_period_end", { withTimezone: true }),
    trial_ends_at: timestamp("trial_ends_at", { withTimezone: true }),
    cancelled_at: timestamp("cancelled_at", { withTimezone: true }),
    access_until: timestamp("access_until", { withTimezone: true }),
    raw_data: jsonb("raw_data"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_subscriptions_user").on(table.user_id),
    statusIdx: index("idx_subscriptions_status").on(table.status),
    dodoSubIdx: index("idx_subscriptions_dodo_sub").on(
      table.dodo_subscription_id,
    ),
    periodEndIdx: index("idx_subscriptions_period_end").on(
      table.current_period_end,
    ),
  }),
);

// ─── Payments ─────────────────────────────────────────────────────────────────
// Immutable DodoPayments event ledger. One row per webhook event, never mutated.

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    subscription_id: uuid("subscription_id").references(() => subscriptions.id),
    dodo_payment_id: varchar("dodo_payment_id", { length: 255 }).unique(),
    dodo_customer_id: varchar("dodo_customer_id", { length: 255 }),
    event_type: varchar("event_type", { length: 100 }).notNull(),
    status: paymentStatusEnum("status").notNull(),
    amount: integer("amount").notNull(),
    currency: varchar("currency", { length: 10 }).notNull().default("USD"),
    raw_payload: jsonb("raw_payload"),
    paid_at: timestamp("paid_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userIdx: index("idx_payments_user").on(table.user_id, table.created_at),
    dodoPaymentIdx: index("idx_payments_dodo_payment").on(
      table.dodo_payment_id,
    ),
    statusIdx: index("idx_payments_status").on(table.status),
  }),
);

// ─── Notification Templates ───────────────────────────────────────────────────
// Reusable Handlebars-style email templates keyed by a unique slug.

export const notification_templates = pgTable(
  "notification_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    html_body: text("html_body").notNull(),
    text_body: text("text_body"),
    metadata: jsonb("metadata"),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    slugIdx: index("idx_notif_templates_slug").on(table.slug),
  }),
);

// ─── Email Notifications ──────────────────────────────────────────────────────
// Per-user email dispatch log for job alerts and transactional emails.

export const email_notifications = pgTable(
  "email_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    template_id: uuid("template_id").references(
      () => notification_templates.id,
    ),
    to_email: varchar("to_email", { length: 255 }).notNull(),
    subject: varchar("subject", { length: 500 }).notNull(),
    status: notificationStatusEnum("status").notNull().default("pending"),
    template_variables: jsonb("template_variables"),
    job_ids: jsonb("job_ids"),
    provider_message_id: varchar("provider_message_id", { length: 255 }),
    error_message: text("error_message"),
    retry_count: integer("retry_count").default(0),
    scheduled_at: timestamp("scheduled_at", { withTimezone: true }),
    sent_at: timestamp("sent_at", { withTimezone: true }),
    opened_at: timestamp("opened_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    pendingQueueIdx: index("idx_email_notif_pending").on(
      table.status,
      table.scheduled_at,
    ),
    userIdx: index("idx_email_notif_user").on(table.user_id, table.created_at),
    templateIdx: index("idx_email_notif_template").on(table.template_id),
  }),
);

// ─── Relations ────────────────────────────────────────────────────────────────
// Declared after all tables to avoid forward-reference errors.

export const usersRelations = relations(users, ({ one, many }) => ({
  resumes: many(resumes),
  conversations: many(conversations),
  job_matches: many(job_matches),
  discord_configs: many(discord_configs),
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
  email_notifications: many(email_notifications),
  career_site_integrations: many(career_site_integrations),
}));

export const discordConfigsRelations = relations(
  discord_configs,
  ({ one }) => ({
    user: one(users, {
      fields: [discord_configs.user_id],
      references: [users.id],
    }),
  }),
);

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.user_id],
    references: [users.id],
  }),
}));

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

export const employerProfilesRelations = relations(
  employer_profiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [employer_profiles.user_id],
      references: [users.id],
    }),
    jobs: many(jobs),
    career_site_integrations: many(career_site_integrations),
  }),
);

export const seekerProfilesRelations = relations(
  seeker_profiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [seeker_profiles.user_id],
      references: [users.id],
    }),
    applications: many(applications),
  }),
);

export const applicationsRelations = relations(applications, ({ one }) => ({
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
  seeker_profile: one(seeker_profiles, {
    fields: [applications.seeker_id],
    references: [seeker_profiles.user_id],
  }),
}));

export const careerSiteIntegrationsRelations = relations(
  career_site_integrations,
  ({ one }) => ({
    employer: one(users, {
      fields: [career_site_integrations.employer_id],
      references: [users.id],
    }),
    employer_profile: one(employer_profiles, {
      fields: [career_site_integrations.employer_id],
      references: [employer_profiles.user_id],
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

export const messageAttachmentsRelations = relations(
  message_attachments,
  ({ one }) => ({
    message: one(messages, {
      fields: [message_attachments.message_id],
      references: [messages.id],
    }),
  }),
);

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

export const notificationTemplatesRelations = relations(
  notification_templates,
  ({ many }) => ({
    email_notifications: many(email_notifications),
  }),
);

export const emailNotificationsRelations = relations(
  email_notifications,
  ({ one }) => ({
    user: one(users, {
      fields: [email_notifications.user_id],
      references: [users.id],
    }),
    template: one(notification_templates, {
      fields: [email_notifications.template_id],
      references: [notification_templates.id],
    }),
  }),
);
