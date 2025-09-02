-- CreateEnum
CREATE TYPE "public"."WorkType" AS ENUM ('REMOTE', 'ONSITE', 'HYBRID', 'FLEXIBLE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE', 'VOLUNTEER', 'SEASONAL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."RoleType" AS ENUM ('INDIVIDUAL_CONTRIBUTOR', 'PEOPLE_MANAGER', 'TECHNICAL_LEAD', 'EXECUTIVE', 'CONSULTANT', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."SeniorityLevel" AS ENUM ('INTERN', 'ENTRY_LEVEL', 'MID_LEVEL', 'SENIOR_LEVEL', 'STAFF_LEVEL', 'PRINCIPAL_LEVEL', 'DIRECTOR_LEVEL', 'VP_LEVEL', 'C_LEVEL', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "public"."ApplicationStatus" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW_SCHEDULED', 'INTERVIEWED', 'OFFER_RECEIVED', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "public"."SalaryUnit" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUAL', 'UNKNOWN');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verificationtokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."companies" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "website" VARCHAR(500),
    "tagline" TEXT,
    "industry" VARCHAR(100),
    "employees" INTEGER,
    "founded" INTEGER,
    "headquarters" VARCHAR(100),
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "logo" VARCHAR(500),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."jobs" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "source" TEXT,
    "title" VARCHAR(255) NOT NULL,
    "coreTitle" VARCHAR(255),
    "description" TEXT,
    "requirements" TEXT,
    "location" VARCHAR(255),
    "workType" "public"."WorkType" NOT NULL DEFAULT 'ONSITE',
    "jobTypes" "public"."JobType"[],
    "experience" VARCHAR(100),
    "managementExperience" VARCHAR(100),
    "category" VARCHAR(100),
    "roleType" "public"."RoleType",
    "seniorityLevel" "public"."SeniorityLevel",
    "salary" VARCHAR(100),
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" VARCHAR(10),
    "salaryUnit" "public"."SalaryUnit" DEFAULT 'ANNUAL',
    "applyUrl" VARCHAR(1000),
    "postedDate" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "companyId" TEXT,
    "searchVector" TEXT,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skills" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(50),
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_skills" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bio" TEXT,
    "experience" VARCHAR(100),
    "location" VARCHAR(255),
    "resume" VARCHAR(500),
    "portfolio" VARCHAR(500),
    "linkedin" VARCHAR(500),
    "github" VARCHAR(500),
    "website" VARCHAR(500),
    "preferredWorkType" "public"."WorkType",
    "preferredSalaryMin" INTEGER,
    "preferredSalaryMax" INTEGER,
    "preferredLocations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_skills" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "proficiency" SMALLINT NOT NULL DEFAULT 1,
    "yearsExp" SMALLINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."job_applications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "status" "public"."ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "coverLetter" TEXT,
    "notes" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."JobJobType" (
    "jobId" TEXT NOT NULL,
    "jobType" "public"."JobType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobJobType_pkey" PRIMARY KEY ("jobId","jobType")
);

-- CreateTable
CREATE TABLE "public"."saved_jobs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "notes" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "public"."accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_token_key" ON "public"."verificationtokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verificationtokens_identifier_token_key" ON "public"."verificationtokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "public"."companies"("name");

-- CreateIndex
CREATE INDEX "companies_industry_idx" ON "public"."companies"("industry");

-- CreateIndex
CREATE INDEX "companies_employees_idx" ON "public"."companies"("employees");

-- CreateIndex
CREATE UNIQUE INDEX "companies_source_externalId_key" ON "public"."companies"("source", "externalId");

-- CreateIndex
CREATE INDEX "jobs_title_idx" ON "public"."jobs"("title");

-- CreateIndex
CREATE INDEX "jobs_category_idx" ON "public"."jobs"("category");

-- CreateIndex
CREATE INDEX "jobs_workType_idx" ON "public"."jobs"("workType");

-- CreateIndex
CREATE INDEX "jobs_seniorityLevel_idx" ON "public"."jobs"("seniorityLevel");

-- CreateIndex
CREATE INDEX "jobs_postedDate_idx" ON "public"."jobs"("postedDate");

-- CreateIndex
CREATE INDEX "jobs_salaryMin_salaryMax_idx" ON "public"."jobs"("salaryMin", "salaryMax");

-- CreateIndex
CREATE INDEX "jobs_companyId_idx" ON "public"."jobs"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_source_externalId_key" ON "public"."jobs"("source", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "public"."skills"("name");

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "public"."skills"("name");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "public"."skills"("category");

-- CreateIndex
CREATE UNIQUE INDEX "job_skills_jobId_skillId_key" ON "public"."job_skills"("jobId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "public"."user_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillId_key" ON "public"."user_skills"("userId", "skillId");

-- CreateIndex
CREATE INDEX "job_applications_status_idx" ON "public"."job_applications"("status");

-- CreateIndex
CREATE INDEX "job_applications_appliedAt_idx" ON "public"."job_applications"("appliedAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_userId_jobId_key" ON "public"."job_applications"("userId", "jobId");

-- CreateIndex
CREATE INDEX "saved_jobs_savedAt_idx" ON "public"."saved_jobs"("savedAt");

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_userId_jobId_key" ON "public"."saved_jobs"("userId", "jobId");

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."jobs" ADD CONSTRAINT "jobs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_skills" ADD CONSTRAINT "job_skills_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_skills" ADD CONSTRAINT "job_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_applications" ADD CONSTRAINT "job_applications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."JobJobType" ADD CONSTRAINT "JobJobType_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."saved_jobs" ADD CONSTRAINT "saved_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."saved_jobs" ADD CONSTRAINT "saved_jobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "public"."jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
