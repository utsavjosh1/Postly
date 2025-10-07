import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  pgEnum,
  unique,
  index,
  primaryKey,
  smallint,
  json,
  customType,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId as cuid } from "@paralleldrive/cuid2";

// Custom types for special handling
const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "USER",
  "RECRUITER",
  "OWNER",
  "ADMIN",
]);
export const workTypeEnum = pgEnum("work_type", [
  "REMOTE",
  "ONSITE",
  "HYBRID",
  "FLEXIBLE",
  "UNKNOWN",
]);
export const jobTypeEnum = pgEnum("job_type", [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "TEMPORARY",
  "INTERNSHIP",
  "FREELANCE",
  "VOLUNTEER",
  "SEASONAL",
  "UNKNOWN",
]);
export const roleTypeEnum = pgEnum("role_type", [
  "INDIVIDUAL_CONTRIBUTOR",
  "PEOPLE_MANAGER",
  "TECHNICAL_LEAD",
  "EXECUTIVE",
  "CONSULTANT",
  "UNKNOWN",
]);
export const seniorityLevelEnum = pgEnum("seniority_level", [
  "INTERN",
  "ENTRY_LEVEL",
  "MID_LEVEL",
  "SENIOR_LEVEL",
  "STAFF_LEVEL",
  "PRINCIPAL_LEVEL",
  "DIRECTOR_LEVEL",
  "VP_LEVEL",
  "C_LEVEL",
  "UNKNOWN",
]);
export const applicationStatusEnum = pgEnum("application_status", [
  "APPLIED",
  "SCREENING",
  "INTERVIEW_SCHEDULED",
  "INTERVIEWED",
  "OFFER_RECEIVED",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "ON_HOLD",
]);
export const salaryUnitEnum = pgEnum("salary_unit", [
  "HOURLY",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "ANNUAL",
  "UNKNOWN",
]);
export const organizationRoleEnum = pgEnum("organization_role", [
  "OWNER",
  "ADMIN",
  "MEMBER",
]);
export const billingIntervalEnum = pgEnum("billing_interval", [
  "MONTH",
  "YEAR",
  "ONCE",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "ACTIVE",
  "PAST_DUE",
  "CANCELED",
  "TRIALING",
  "UNPAID",
  "INCOMPLETE",
]);
export const purchaseStatusEnum = pgEnum("purchase_status", [
  "SUCCEEDED",
  "PENDING",
  "FAILED",
  "REFUNDED",
]);
export const integrationTypeEnum = pgEnum("integration_type", [
  "DISCORD",
  "TWITTER",
  "WHATSAPP",
]);
export const deliveryStatusEnum = pgEnum("delivery_status", [
  "PENDING",
  "SENT",
  "FAILED",
  "RETRYING",
  "IGNORED",
]);
export const resumeStatusEnum = pgEnum("resume_status", [
  "PENDING",
  "PROCESSING",
  "PARSED",
  "FAILED",
  "REVOKED",
]);
export const applicationSourceEnum = pgEnum("application_source", [
  "WEB",
  "BOT",
  "DISCORD",
  "WHATSAPP",
  "TWITTER",
  "API",
]);

// Base / Auth Models
export const users = pgTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    email: text("email").unique().notNull(),
    name: text("name"),
    avatar: text("avatar"),
    role: userRoleEnum("role").default("USER").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    isDisabled: boolean("is_disabled").default(false).notNull(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  })
);

export const accounts = pgTable(
  "accounts",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken: text("refresh_token"),
    accessToken: text("access_token"),
    expiresAt: integer("expires_at"),
    tokenType: text("token_type"),
    scope: text("scope"),
    idToken: text("id_token"),
    sessionState: text("session_state"),
  },
  (table) => ({
    providerProviderAccountIdx: unique(
      "accounts_provider_provider_account_id_key"
    ).on(table.provider, table.providerAccountId),
  })
);

export const sessions = pgTable("sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  sessionToken: text("session_token").unique().notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationtokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").unique().notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    identifierTokenKey: unique("verification_tokens_identifier_token_key").on(
      table.identifier,
      table.token
    ),
  })
);

// Core Job Models
export const companies = pgTable(
  "companies",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    externalId: text("external_id"),
    source: text("source"),
    name: varchar("name", { length: 255 }).notNull(),
    website: varchar("website", { length: 500 }),
    tagline: text("tagline"),
    industry: varchar("industry", { length: 100 }),
    employees: integer("employees"),
    founded: integer("founded"),
    headquarters: varchar("headquarters", { length: 100 }),
    isPublic: boolean("is_public").default(false).notNull(),
    logo: varchar("logo", { length: 500 }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    isVerified: boolean("is_verified").default(false).notNull(),
  },
  (table) => ({
    sourceExternalIdKey: unique("companies_source_external_id_key").on(
      table.source,
      table.externalId
    ),
    nameIdx: index("companies_name_idx").on(table.name),
    industryIdx: index("companies_industry_idx").on(table.industry),
    employeesIdx: index("companies_employees_idx").on(table.employees),
  })
);

export const jobs = pgTable(
  "jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    externalId: text("external_id"),
    source: text("source"),
    postedByUserId: text("posted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    title: varchar("title", { length: 255 }).notNull(),
    coreTitle: varchar("core_title", { length: 255 }),
    description: text("description"),
    requirements: text("requirements"),
    location: varchar("location", { length: 255 }),
    workType: workTypeEnum("work_type").default("ONSITE").notNull(),
    jobTypes: jobTypeEnum("job_types").array(),
    experience: varchar("experience", { length: 100 }),
    managementExperience: varchar("management_experience", { length: 100 }),
    category: varchar("category", { length: 100 }),
    roleType: roleTypeEnum("role_type"),
    seniorityLevel: seniorityLevelEnum("seniority_level"),
    salary: varchar("salary", { length: 100 }),
    salaryMin: integer("salary_min"),
    salaryMax: integer("salary_max"),
    salaryCurrency: varchar("salary_currency", { length: 10 }),
    salaryUnit: salaryUnitEnum("salary_unit").default("ANNUAL"),
    applyUrl: varchar("apply_url", { length: 1000 }),
    postedDate: timestamp("posted_date", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    companyId: text("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),
    searchVector: text("search_vector"),
    embedding: json("embedding").$type<number[]>(),
  },
  (table) => ({
    sourceExternalIdKey: unique("jobs_source_external_id_key").on(
      table.source,
      table.externalId
    ),
    titleIdx: index("jobs_title_idx").on(table.title),
    categoryIdx: index("jobs_category_idx").on(table.category),
    workTypeIdx: index("jobs_work_type_idx").on(table.workType),
    seniorityLevelIdx: index("jobs_seniority_level_idx").on(
      table.seniorityLevel
    ),
    postedDateIdx: index("jobs_posted_date_idx").on(table.postedDate),
    salaryRangeIdx: index("jobs_salary_range_idx").on(
      table.salaryMin,
      table.salaryMax
    ),
    companyIdIdx: index("jobs_company_id_idx").on(table.companyId),
  })
);

export const skills = pgTable(
  "skills",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    name: varchar("name", { length: 100 }).unique().notNull(),
    category: varchar("category", { length: 50 }),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    nameIdx: index("skills_name_idx").on(table.name),
    categoryIdx: index("skills_category_idx").on(table.category),
  })
);

export const jobSkills = pgTable(
  "job_skills",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    jobSkillKey: unique("job_skills_job_id_skill_id_key").on(
      table.jobId,
      table.skillId
    ),
  })
);

// User Profile & Skills
export const userProfiles = pgTable("user_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  userId: text("user_id")
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  bio: text("bio"),
  experience: varchar("experience", { length: 100 }),
  location: varchar("location", { length: 255 }),
  resume: varchar("resume", { length: 1000 }),
  resumeParsed: boolean("resume_parsed").default(false).notNull(),
  resumeParsedAt: timestamp("resume_parsed_at", { withTimezone: true }),
  resumeRaw: text("resume_raw"),
  portfolio: varchar("portfolio", { length: 500 }),
  linkedin: varchar("linkedin", { length: 500 }),
  github: varchar("github", { length: 500 }),
  website: varchar("website", { length: 500 }),
  preferredWorkType: workTypeEnum("preferred_work_type"),
  preferredSalaryMin: integer("preferred_salary_min"),
  preferredSalaryMax: integer("preferred_salary_max"),
  preferredLocations: text("preferred_locations").array(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const userSkills = pgTable(
  "user_skills",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    skillId: text("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    proficiency: smallint("proficiency").default(1).notNull(),
    yearsExp: smallint("years_exp"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userSkillKey: unique("user_skills_user_id_skill_id_key").on(
      table.userId,
      table.skillId
    ),
  })
);

// Applications & Saves
export const jobApplications = pgTable(
  "job_applications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").default("APPLIED").notNull(),
    coverLetter: text("cover_letter"),
    notes: text("notes"),
    source: applicationSourceEnum("source"),
    metadata: json("metadata"),
    appliedAt: timestamp("applied_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userJobKey: unique("job_applications_user_id_job_id_key").on(
      table.userId,
      table.jobId
    ),
    statusIdx: index("job_applications_status_idx").on(table.status),
    appliedAtIdx: index("job_applications_applied_at_idx").on(table.appliedAt),
  })
);

export const savedJobs = pgTable(
  "saved_jobs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    notes: text("notes"),
    savedAt: timestamp("saved_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    userJobKey: unique("saved_jobs_user_id_job_id_key").on(
      table.userId,
      table.jobId
    ),
    savedAtIdx: index("saved_jobs_saved_at_idx").on(table.savedAt),
  })
);

// Job Type Normalization
export const jobJobTypes = pgTable(
  "job_job_types",
  {
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    jobType: jobTypeEnum("job_type").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.jobId, table.jobType] }),
  })
);

// Tags & Owner Filters
export const tags = pgTable("tags", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("name").unique().notNull(),
  slug: text("slug").unique().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const jobTags = pgTable(
  "job_tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    jobId: text("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    jobTagKey: unique("job_tags_job_id_tag_id_key").on(
      table.jobId,
      table.tagId
    ),
  })
);

export const ownerTagFilters = pgTable("owner_tag_filters", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tags: text("tags").array(),
  includeJobTypes: jobTypeEnum("include_job_types").array(),
  minSeniority: seniorityLevelEnum("min_seniority"),
  maxSalaryMin: integer("max_salary_min"),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Organizations / Owners / Integrations
export const organizations = pgTable("organizations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  website: text("website"),
  ownerId: text("owner_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  isVerified: boolean("is_verified").default(false).notNull(),
});

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: organizationRoleEnum("role").default("MEMBER").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    orgUserKey: unique("organization_members_organization_id_user_id_key").on(
      table.organizationId,
      table.userId
    ),
  })
);

// Subscriptions & Payments
export const plans = pgTable("plans", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  key: text("key").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  priceCents: integer("price_cents").notNull(),
  currency: text("currency").default("usd").notNull(),
  interval: billingIntervalEnum("interval").default("MONTH").notNull(),
  limits: json("limits"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    planId: text("plan_id")
      .notNull()
      .references(() => plans.id, { onDelete: "restrict" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull(),
    providerSubId: text("provider_sub_id"),
    status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
    startAt: timestamp("start_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIdx: index("subscriptions_status_idx").on(table.status),
  })
);

export const purchases = pgTable(
  "purchases",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    subscriptionId: text("subscription_id").references(() => subscriptions.id, {
      onDelete: "set null",
    }),
    planId: text("plan_id").references(() => plans.id, {
      onDelete: "set null",
    }),
    provider: text("provider").notNull(),
    providerPaymentId: text("provider_payment_id"),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").default("usd").notNull(),
    status: purchaseStatusEnum("status").notNull(),
    metadata: json("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIdx: index("purchases_status_idx").on(table.status),
  })
);

// Integrations
export const discordIntegrations = pgTable("discord_integrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  organizationId: text("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  botToken: text("bot_token"),
  guildId: text("guild_id"),
  channelId: text("channel_id"),
  isActive: boolean("is_active").default(true).notNull(),
  settings: json("settings"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const twitterIntegrations = pgTable("twitter_integrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  organizationId: text("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  apiKey: text("api_key"),
  apiSecret: text("api_secret"),
  accessToken: text("access_token"),
  accessSecret: text("access_secret"),
  handle: text("handle"),
  isActive: boolean("is_active").default(false).notNull(),
  settings: json("settings"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export const whatsappIntegrations = pgTable("whatsapp_integrations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  organizationId: text("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  phoneNumberId: text("phone_number_id"),
  accessToken: text("access_token"),
  settings: json("settings"),
  isActive: boolean("is_active").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Delivery / Notifications & Logs
export const deliveryLogs = pgTable(
  "delivery_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    jobId: text("job_id").references(() => jobs.id, { onDelete: "set null" }),
    integrationType: integrationTypeEnum("integration_type").notNull(),
    integrationId: text("integration_id"),
    destinationId: text("destination_id"),
    organizationId: text("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    status: deliveryStatusEnum("status").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastAttemptAt: timestamp("last_attempt_at", { withTimezone: true }),
    payload: json("payload"),
    response: json("response"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    statusIdx: index("delivery_logs_status_idx").on(table.status),
  })
);

// Recruiter Profile
export const recruiterProfiles = pgTable("recruiter_profiles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => cuid()),
  userId: text("user_id")
    .unique()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: text("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  title: text("title"),
  website: text("website"),
  verified: boolean("verified").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Resume Uploads & Parsing
export const resumes = pgTable(
  "resumes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 1000 }),
    filename: text("filename"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    parsedJson: json("parsed_json"),
    text: text("text"),
    status: resumeStatusEnum("status").default("PENDING").notNull(),
    parsedAt: timestamp("parsed_at", { withTimezone: true }),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    keepRaw: boolean("keep_raw").default(false).notNull(),
  },
  (table) => ({
    statusIdx: index("resumes_status_idx").on(table.status),
  })
);

// Audit / Event Logs
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    resource: text("resource"),
    metadata: json("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  })
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  applications: many(jobApplications),
  savedJobs: many(savedJobs),
  profile: one(userProfiles, {
    fields: [users.id],
    references: [userProfiles.userId],
  }),
  skills: many(userSkills),
  organizationMemberships: many(organizationMembers),
  purchases: many(purchases),
  subscriptions: many(subscriptions),
  discordIntegrations: many(discordIntegrations),
  twitterIntegrations: many(twitterIntegrations),
  whatsappIntegrations: many(whatsappIntegrations),
  postedJobs: many(jobs, {
    relationName: "postedJobs",
  }),
  auditLogs: many(auditLogs),
  resumes: many(resumes),
  recruiterProfile: one(recruiterProfiles, {
    fields: [users.id],
    references: [recruiterProfiles.userId],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many, one }) => ({
  jobs: many(jobs),
  recruiterProfiles: many(recruiterProfiles),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  company: one(companies, {
    fields: [jobs.companyId],
    references: [companies.id],
  }),
  postedByUser: one(users, {
    fields: [jobs.postedByUserId],
    references: [users.id],
    relationName: "postedJobs",
  }),
  skills: many(jobSkills),
  applications: many(jobApplications),
  savedByUsers: many(savedJobs),
  jobTypes: many(jobJobTypes),
  tags: many(jobTags),
  deliveryLogs: many(deliveryLogs),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  jobs: many(jobSkills),
  users: many(userSkills),
}));

export const jobSkillsRelations = relations(jobSkills, ({ one }) => ({
  job: one(jobs, {
    fields: [jobSkills.jobId],
    references: [jobs.id],
  }),
  skill: one(skills, {
    fields: [jobSkills.skillId],
    references: [skills.id],
  }),
}));

export const userProfilesRelations = relations(
  userProfiles,
  ({ one, many }) => ({
    user: one(users, {
      fields: [userProfiles.userId],
      references: [users.id],
    }),
  })
);

export const userSkillsRelations = relations(userSkills, ({ one }) => ({
  user: one(users, {
    fields: [userSkills.userId],
    references: [users.id],
  }),
  skill: one(skills, {
    fields: [userSkills.skillId],
    references: [skills.id],
  }),
}));

export const jobApplicationsRelations = relations(
  jobApplications,
  ({ one }) => ({
    user: one(users, {
      fields: [jobApplications.userId],
      references: [users.id],
    }),
    job: one(jobs, {
      fields: [jobApplications.jobId],
      references: [jobs.id],
    }),
  })
);

export const savedJobsRelations = relations(savedJobs, ({ one }) => ({
  user: one(users, {
    fields: [savedJobs.userId],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [savedJobs.jobId],
    references: [jobs.id],
  }),
}));

export const jobJobTypesRelations = relations(jobJobTypes, ({ one }) => ({
  job: one(jobs, {
    fields: [jobJobTypes.jobId],
    references: [jobs.id],
  }),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  jobs: many(jobTags),
  ownerFilters: many(ownerTagFilters),
}));

export const jobTagsRelations = relations(jobTags, ({ one }) => ({
  job: one(jobs, {
    fields: [jobTags.jobId],
    references: [jobs.id],
  }),
  tag: one(tags, {
    fields: [jobTags.tagId],
    references: [tags.id],
  }),
}));

export const ownerTagFiltersRelations = relations(
  ownerTagFilters,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [ownerTagFilters.organizationId],
      references: [organizations.id],
    }),
  })
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  members: many(organizationMembers),
  subscriptions: many(subscriptions),
  purchases: many(purchases),
  discordIntegrations: many(discordIntegrations),
  twitterIntegrations: many(twitterIntegrations),
  whatsappIntegrations: many(whatsappIntegrations),
  tagFilters: many(ownerTagFilters),
  deliveryLogs: many(deliveryLogs),
}));

export const organizationMembersRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [organizationMembers.userId],
      references: [users.id],
    }),
  })
);

export const plansRelations = relations(plans, ({ many }) => ({
  subscriptions: many(subscriptions),
  purchases: many(purchases),
}));

export const subscriptionsRelations = relations(
  subscriptions,
  ({ one, many }) => ({
    plan: one(plans, {
      fields: [subscriptions.planId],
      references: [plans.id],
    }),
    user: one(users, {
      fields: [subscriptions.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [subscriptions.organizationId],
      references: [organizations.id],
    }),
    purchases: many(purchases),
  })
);

export const purchasesRelations = relations(purchases, ({ one }) => ({
  user: one(users, {
    fields: [purchases.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [purchases.organizationId],
    references: [organizations.id],
  }),
  subscription: one(subscriptions, {
    fields: [purchases.subscriptionId],
    references: [subscriptions.id],
  }),
  plan: one(plans, {
    fields: [purchases.planId],
    references: [plans.id],
  }),
}));

export const discordIntegrationsRelations = relations(
  discordIntegrations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [discordIntegrations.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [discordIntegrations.userId],
      references: [users.id],
    }),
    deliveryLogs: many(deliveryLogs),
  })
);

export const twitterIntegrationsRelations = relations(
  twitterIntegrations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [twitterIntegrations.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [twitterIntegrations.userId],
      references: [users.id],
    }),
    deliveryLogs: many(deliveryLogs),
  })
);

export const whatsappIntegrationsRelations = relations(
  whatsappIntegrations,
  ({ one, many }) => ({
    organization: one(organizations, {
      fields: [whatsappIntegrations.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [whatsappIntegrations.userId],
      references: [users.id],
    }),
    deliveryLogs: many(deliveryLogs),
  })
);

export const deliveryLogsRelations = relations(deliveryLogs, ({ one }) => ({
  job: one(jobs, {
    fields: [deliveryLogs.jobId],
    references: [jobs.id],
  }),
  organization: one(organizations, {
    fields: [deliveryLogs.organizationId],
    references: [organizations.id],
  }),
}));

export const recruiterProfilesRelations = relations(
  recruiterProfiles,
  ({ one }) => ({
    user: one(users, {
      fields: [recruiterProfiles.userId],
      references: [users.id],
    }),
    company: one(companies, {
      fields: [recruiterProfiles.companyId],
      references: [companies.id],
    }),
  })
);

export const resumesRelations = relations(resumes, ({ one }) => ({
  user: one(users, {
    fields: [resumes.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Type exports for better TypeScript support
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type Job = typeof jobs.$inferSelect;
export type NewJob = typeof jobs.$inferInsert;
export type Skill = typeof skills.$inferSelect;
export type NewSkill = typeof skills.$inferInsert;
export type JobSkill = typeof jobSkills.$inferSelect;
export type NewJobSkill = typeof jobSkills.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserSkill = typeof userSkills.$inferSelect;
export type NewUserSkill = typeof userSkills.$inferInsert;
export type JobApplication = typeof jobApplications.$inferSelect;
export type NewJobApplication = typeof jobApplications.$inferInsert;
export type SavedJob = typeof savedJobs.$inferSelect;
export type NewSavedJob = typeof savedJobs.$inferInsert;
export type JobJobType = typeof jobJobTypes.$inferSelect;
export type NewJobJobType = typeof jobJobTypes.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type JobTag = typeof jobTags.$inferSelect;
export type NewJobTag = typeof jobTags.$inferInsert;
export type OwnerTagFilter = typeof ownerTagFilters.$inferSelect;
export type NewOwnerTagFilter = typeof ownerTagFilters.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type OrganizationMember = typeof organizationMembers.$inferSelect;
export type NewOrganizationMember = typeof organizationMembers.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type DiscordIntegration = typeof discordIntegrations.$inferSelect;
export type NewDiscordIntegration = typeof discordIntegrations.$inferInsert;
export type TwitterIntegration = typeof twitterIntegrations.$inferSelect;
export type NewTwitterIntegration = typeof twitterIntegrations.$inferInsert;
export type WhatsAppIntegration = typeof whatsappIntegrations.$inferSelect;
export type NewWhatsAppIntegration = typeof whatsappIntegrations.$inferInsert;
export type DeliveryLog = typeof deliveryLogs.$inferSelect;
export type NewDeliveryLog = typeof deliveryLogs.$inferInsert;
export type RecruiterProfile = typeof recruiterProfiles.$inferSelect;
export type NewRecruiterProfile = typeof recruiterProfiles.$inferInsert;
export type Resume = typeof resumes.$inferSelect;
export type NewResume = typeof resumes.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
