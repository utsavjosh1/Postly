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
  "free",
  "seeker",
  "employer",
  "discord_owner",
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

export const scrapeSourceStatusEnum = pgEnum("scrape_source_status", [
  "active",
  "paused",
  "broken",
  "rate_limited",
]);

export const botPlatformEnum = pgEnum("bot_platform", [
  "discord",
  "reddit",
  "twitter",
  "slack",
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
    resetTokenIdx: index("idx_users_reset_token").on(
      table.password_reset_token,
    ),
  }),
);

// ─── OTP Codes ────────────────────────────────────────────────────────────────

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

// ─── Scraper Infrastructure ──────────────────────────────────────────────────

export const scrape_sources = pgTable(
  "scrape_sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    base_url: text("base_url").notNull(),
    scraper_type: varchar("scraper_type", { length: 50 }).notNull(), // "rss", "html", "api", "playwright"
    config: jsonb("config").notNull(), // CSS selectors, pagination rules, rate limits, headers
    status: scrapeSourceStatusEnum("status").default("active"),

    // Rate limiting per source
    requests_per_minute: integer("requests_per_minute").default(10),
    retry_after_seconds: integer("retry_after_seconds").default(60),

    // Scheduling
    crawl_interval_minutes: integer("crawl_interval_minutes").default(60),
    last_crawled_at: timestamp("last_crawled_at", { withTimezone: true }),
    next_crawl_at: timestamp("next_crawl_at", { withTimezone: true }),

    // Health
    consecutive_failures: integer("consecutive_failures").default(0),
    last_error: text("last_error"),
    total_jobs_scraped: integer("total_jobs_scraped").default(0),

    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    crawlQueueIdx: index("idx_scrape_sources_queue").on(
      t.status,
      t.next_crawl_at,
    ),
  }),
);

export const scrape_runs = pgTable(
  "scrape_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source_id: uuid("source_id")
      .notNull()
      .references(() => scrape_sources.id, { onDelete: "cascade" }),
    started_at: timestamp("started_at", { withTimezone: true }).defaultNow(),
    completed_at: timestamp("completed_at", { withTimezone: true }),
    status: varchar("status", { length: 30 }).default("running"), // running, success, partial, failed
    jobs_found: integer("jobs_found").default(0),
    jobs_new: integer("jobs_new").default(0),
    jobs_updated: integer("jobs_updated").default(0),
    jobs_deduped: integer("jobs_deduped").default(0),
    error_log: jsonb("error_log"),
  },
  (t) => ({
    sourceIdx: index("idx_scrape_runs_source").on(t.source_id, t.started_at),
  }),
);

// ─── Promo Codes ─────────────────────────────────────────────────────────────

export const promo_codes = pgTable("promo_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 100 }).notNull().unique(),
  discount_type: varchar("discount_type", { length: 20 }).notNull(), // "percent" | "fixed"
  discount_value: decimal("discount_value", {
    precision: 10,
    scale: 2,
  }).notNull(),
  applies_to_plan: subscriptionPlanEnum("applies_to_plan"),
  max_uses: integer("max_uses"),
  uses_count: integer("uses_count").default(0),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Notification Templates ───────────────────────────────────────────────────

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
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    slugIdx: index("idx_notif_templates_slug").on(table.slug),
  }),
);

// ─── Rate Limiting ──────────────────────────────────────────────────────────

export const plan_quotas = pgTable("plan_quotas", {
  id: uuid("id").primaryKey().defaultRandom(),
  plan: subscriptionPlanEnum("plan").notNull().unique(),
  // AI tokens
  ai_tokens_per_day: integer("ai_tokens_per_day"), // null = unlimited (admin)
  ai_tokens_per_month: integer("ai_tokens_per_month"),
  // Job matches / searches
  job_matches_per_day: integer("job_matches_per_day"),
  job_searches_per_day: integer("job_searches_per_day"),
  // API calls
  api_calls_per_minute: integer("api_calls_per_minute"),
  api_calls_per_day: integer("api_calls_per_day"),
  // Resume parses
  resume_parses_per_month: integer("resume_parses_per_month"),
  // Bot posts (discord_owner tier specific)
  bot_posts_per_day: integer("bot_posts_per_day"),
  // Admin override flag
  is_unlimited: boolean("is_unlimited").default(false),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// ─── AI Improvements ─────────────────────────────────────────────────────────

export const system_prompts = pgTable(
  "system_prompts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    version: integer("version").notNull(),
    slug: varchar("slug", { length: 100 }).notNull(), // "job_seeker_v3", "employer_v1"
    content: text("content").notNull(),
    is_active: boolean("is_active").default(false),
    created_by: uuid("created_by").references(() => users.id),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    activeSlugIdx: index("idx_system_prompts_active").on(t.slug, t.is_active),
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
    guild_name: varchar("guild_name", { length: 255 }), // for UI display
    channel_name: varchar("channel_name", { length: 255 }), // #job-alerts etc
    bot_webhook_url: text("bot_webhook_url"), // for posting without bot token
    job_filters: jsonb("job_filters"), // { locations: [], job_types: [], keywords: [], min_salary: null }
    post_format: varchar("post_format", { length: 50 }).default("embed"), // "embed" | "plain" | "compact"
    ping_role_id: varchar("ping_role_id", { length: 255 }), // role to @mention on new posts
    ping_everyone: boolean("ping_everyone").default(false),
    max_posts_per_day: integer("max_posts_per_day").default(10),
    last_post_at: timestamp("last_post_at", { withTimezone: true }),
    posts_today: integer("posts_today").default(0),
    posts_today_reset_at: timestamp("posts_today_reset_at", {
      withTimezone: true,
    }),
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
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
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
    scrape_source_id: uuid("scrape_source_id").references(
      () => scrape_sources.id,
    ),
    external_job_id: varchar("external_job_id", { length: 255 }), // the ID on the source site
    fingerprint: varchar("fingerprint", { length: 64 }), // index this
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    companyIdx: index("idx_jobs_company").on(table.company_name),
    locationIdx: index("idx_jobs_location").on(table.location),
    remoteIdx: index("idx_jobs_remote").on(table.remote),
    jobTypeIdx: index("idx_jobs_type").on(table.job_type),
    activeIdx: index("idx_jobs_active").on(table.is_active),
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
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
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
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
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
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
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
    cover_letter: text("cover_letter"),
    notes: text("notes"),
    external_url: text("external_url"),
    contact_info: jsonb("contact_info"),
    next_interview_at: timestamp("next_interview_at", { withTimezone: true }),
    offer_details: jsonb("offer_details"),
    match_score: decimal("match_score", { precision: 5, scale: 2 }),
    ai_explanation: text("ai_explanation"),
    applied_at: timestamp("applied_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
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
    system_prompt_version: integer("system_prompt_version").default(1),
    total_tokens_used: integer("total_tokens_used").default(0), // denormalized counter
    context_window_used: integer("context_window_used"), // % of context used, for truncation warnings
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
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
    tokens_used: integer("tokens_used"), // actual token count from API response
    model_used: varchar("model_used", { length: 100 }), // which model served this message
    latency_ms: integer("latency_ms"), // time to first token
    finish_reason: varchar("finish_reason", { length: 50 }), // "stop", "max_tokens", "error"
    cost_usd: decimal("cost_usd", { precision: 10, scale: 6 }), // computed from tokens
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
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
    promo_code_id: uuid("promo_code_id").references(() => promo_codes.id),
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
    idempotency_key: varchar("idempotency_key", { length: 255 }).unique(), // dodo_payment_id is already unique, this is extra safety
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
    deleted_at: timestamp("deleted_at", { withTimezone: true }),
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





// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token_hash: varchar("token_hash", { length: 255 }).notNull().unique(),
  ip_address: varchar("ip_address", { length: 45 }), // IPv6-safe
  user_agent: text("user_agent"),
  last_active_at: timestamp("last_active_at", {
    withTimezone: true,
  }).defaultNow(),
  expires_at: timestamp("expires_at", { withTimezone: true }).notNull(),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Application Status History ───────────────────────────────────────────────

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

// ─── Audit Log ───────────────────────────────────────────────────────────────

export const audit_log = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actor_id: uuid("actor_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(), // e.g. "job.delete", "user.ban"
  entity_type: varchar("entity_type", { length: 100 }),
  entity_id: uuid("entity_id"),
  diff: jsonb("diff"), // before/after snapshot
  ip_address: varchar("ip_address", { length: 45 }),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Rate Limiting ──────────────────────────────────────────────────────────



export const token_usage = pgTable(
  "token_usage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    window_type: varchar("window_type", { length: 20 }).notNull(), // "minute", "day", "month"
    window_start: timestamp("window_start", { withTimezone: true }).notNull(),
    tokens_used: integer("tokens_used").notNull().default(0),
    api_calls: integer("api_calls").notNull().default(0),
    job_matches: integer("job_matches").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    userWindowIdx: index("idx_token_usage_user_window").on(
      table.user_id,
      table.window_type,
      table.window_start,
    ),
    uniqueWindow: unique().on(
      table.user_id,
      table.window_type,
      table.window_start,
    ),
  }),
);

export const rate_limit_overrides = pgTable("rate_limit_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  override_type: varchar("override_type", { length: 50 }).notNull(), // "ai_tokens_per_day" etc
  override_value: integer("override_value"), // null = unlimited
  granted_by: uuid("granted_by").references(() => users.id),
  expires_at: timestamp("expires_at", { withTimezone: true }),
  reason: text("reason"),
  created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ─── Discord Improvements ─────────────────────────────────────────────────────

export const discord_posted_jobs = pgTable(
  "discord_posted_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    discord_config_id: uuid("discord_config_id")
      .notNull()
      .references(() => discord_configs.id, { onDelete: "cascade" }),
    job_id: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    message_id: varchar("message_id", { length: 255 }), // Discord message ID for editing/deleting
    posted_at: timestamp("posted_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    uniquePost: unique().on(t.discord_config_id, t.job_id),
    configIdx: index("idx_discord_posted_config").on(t.discord_config_id),
  }),
);

// ─── Bot Configs ─────────────────────────────────────────────────────────────

export const bot_configs = pgTable(
  "bot_configs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: botPlatformEnum("platform").notNull(),

    // Platform-specific identity stored as JSONB (guild_id, subreddit, twitter_handle etc)
    platform_config: jsonb("platform_config").notNull(),

    // Auth — encrypted at rest in your app layer, not plain text here
    credentials: jsonb("credentials"), // { access_token, refresh_token, api_key, ... }
    token_expires_at: timestamp("token_expires_at", { withTimezone: true }),

    // Job filter preferences
    job_filters: jsonb("job_filters"),
    post_format: varchar("post_format", { length: 50 }).default("default"),

    // Rate / scheduling
    max_posts_per_day: integer("max_posts_per_day").default(10),
    post_schedule: jsonb("post_schedule"), // { days: [0-6], hours: [9,12,18] }

    is_active: boolean("is_active").default(true),
    last_post_at: timestamp("last_post_at", { withTimezone: true }),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    userPlatformUnique: unique().on(t.user_id, t.platform),
    activeIdx: index("idx_bot_configs_active").on(t.is_active, t.platform),
  }),
);

export const bot_posts = pgTable(
  "bot_posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bot_config_id: uuid("bot_config_id")
      .notNull()
      .references(() => bot_configs.id, { onDelete: "cascade" }),
    job_id: uuid("job_id").references(() => jobs.id, { onDelete: "set null" }),
    platform: botPlatformEnum("platform").notNull(),
    external_post_id: varchar("external_post_id", { length: 255 }), // Discord msg ID, Reddit post ID, Tweet ID
    content_snapshot: text("content_snapshot"), // what was actually sent
    status: varchar("status", { length: 30 }).default("sent"), // sent, failed, deleted
    error_message: text("error_message"),
    posted_at: timestamp("posted_at", { withTimezone: true }).defaultNow(),
  },
  (t) => ({
    configIdx: index("idx_bot_posts_config").on(t.bot_config_id, t.posted_at),
    dedupeIdx: unique().on(t.bot_config_id, t.job_id),
  }),
);

// ─── Scraper Infrastructure ──────────────────────────────────────────────────



export const job_fingerprints = pgTable("job_fingerprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  job_id: uuid("job_id")
    .notNull()
    .references(() => jobs.id, { onDelete: "cascade" }),
  source_id: uuid("source_id").references(() => scrape_sources.id),
  fingerprint: varchar("fingerprint", { length: 64 }).notNull().unique(), // sha256 of (title+company+location normalized)
  source_url: text("source_url"),
  first_seen_at: timestamp("first_seen_at", {
    withTimezone: true,
  }).defaultNow(),
  last_seen_at: timestamp("last_seen_at", { withTimezone: true }).defaultNow(),
});



// ─── AI Improvements ─────────────────────────────────────────────────────────



// ─── Promo Codes ─────────────────────────────────────────────────────────────



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
  sessions: many(sessions),
  audit_logs: many(audit_log),
  token_usage: many(token_usage),
  rate_limit_overrides: many(rate_limit_overrides),
  bot_configs: many(bot_configs),
  system_prompts: many(system_prompts),
}));

export const discordConfigsRelations = relations(
  discord_configs,
  ({ one, many }) => ({
    user: one(users, {
      fields: [discord_configs.user_id],
      references: [users.id],
    }),
    posted_jobs: many(discord_posted_jobs),
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
  discord_posts: many(discord_posted_jobs),
  bot_posts: many(bot_posts),
  fingerprints: many(job_fingerprints),
  scrape_source: one(scrape_sources, {
    fields: [jobs.scrape_source_id],
    references: [scrape_sources.id],
  }),
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
    seeker_profile: one(seeker_profiles, {
      fields: [applications.seeker_id],
      references: [seeker_profiles.user_id],
    }),
    status_history: many(application_status_history),
  }),
);

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

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.user_id],
    references: [users.id],
  }),
}));

export const applicationStatusHistoryRelations = relations(
  application_status_history,
  ({ one }) => ({
    application: one(applications, {
      fields: [application_status_history.application_id],
      references: [applications.id],
    }),
    actor: one(users, {
      fields: [application_status_history.changed_by],
      references: [users.id],
    }),
  }),
);

export const auditLogRelations = relations(audit_log, ({ one }) => ({
  actor: one(users, {
    fields: [audit_log.actor_id],
    references: [users.id],
  }),
}));

export const tokenUsageRelations = relations(token_usage, ({ one }) => ({
  user: one(users, {
    fields: [token_usage.user_id],
    references: [users.id],
  }),
}));

export const rateLimitOverridesRelations = relations(
  rate_limit_overrides,
  ({ one }) => ({
    user: one(users, {
      fields: [rate_limit_overrides.user_id],
      references: [users.id],
    }),
    admin: one(users, {
      fields: [rate_limit_overrides.granted_by],
      references: [users.id],
    }),
  }),
);

export const discordPostedJobsRelations = relations(
  discord_posted_jobs,
  ({ one }) => ({
    config: one(discord_configs, {
      fields: [discord_posted_jobs.discord_config_id],
      references: [discord_configs.id],
    }),
    job: one(jobs, {
      fields: [discord_posted_jobs.job_id],
      references: [jobs.id],
    }),
  }),
);

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

export const scrapeSourcesRelations = relations(scrape_sources, ({ many }) => ({
  jobs: many(jobs),
  runs: many(scrape_runs),
}));

export const jobFingerprintsRelations = relations(
  job_fingerprints,
  ({ one }) => ({
    job: one(jobs, {
      fields: [job_fingerprints.job_id],
      references: [jobs.id],
    }),
    source: one(scrape_sources, {
      fields: [job_fingerprints.source_id],
      references: [scrape_sources.id],
    }),
  }),
);

export const scrapeRunsRelations = relations(scrape_runs, ({ one }) => ({
  source: one(scrape_sources, {
    fields: [scrape_runs.source_id],
    references: [scrape_sources.id],
  }),
}));

export const systemPromptsRelations = relations(system_prompts, ({ one }) => ({
  author: one(users, {
    fields: [system_prompts.created_by],
    references: [users.id],
  }),
}));

export const promoCodesRelations = relations(promo_codes, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

export const subscriptionsRelationsExtended = relations(
  subscriptions,
  ({ one }) => ({
    user: one(users, {
      fields: [subscriptions.user_id],
      references: [users.id],
    }),
    promo_code: one(promo_codes, {
      fields: [subscriptions.promo_code_id],
      references: [promo_codes.id],
    }),
  }),
);
