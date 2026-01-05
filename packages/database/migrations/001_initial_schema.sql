-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) NOT NULL CHECK (role IN ('job_seeker', 'employer', 'admin')) DEFAULT 'job_seeker',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Resumes table
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  parsed_text TEXT,
  embedding VECTOR(768),
  skills JSONB,
  experience_years INT,
  education JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_embedding ON resumes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  location VARCHAR(255),
  salary_min DECIMAL(10,2),
  salary_max DECIMAL(10,2),
  job_type VARCHAR(50),
  remote BOOLEAN DEFAULT FALSE,
  source VARCHAR(100) NOT NULL,
  source_url TEXT,
  embedding VECTOR(768),
  skills_required JSONB,
  experience_required VARCHAR(100),
  posted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  employer_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_active ON jobs(is_active, created_at DESC);
CREATE INDEX idx_jobs_company ON jobs(company_name);
CREATE INDEX idx_jobs_location ON jobs(location);
CREATE INDEX idx_jobs_remote ON jobs(remote);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Job matches table
CREATE TABLE job_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE NOT NULL,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  match_score DECIMAL(5,2) NOT NULL,
  ai_explanation TEXT,
  is_saved BOOLEAN DEFAULT FALSE,
  applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, job_id)
);

CREATE INDEX idx_job_matches_user ON job_matches(user_id, match_score DESC);
CREATE INDEX idx_job_matches_job ON job_matches(job_id);

-- Bot subscriptions table
CREATE TABLE bot_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_type VARCHAR(50) NOT NULL CHECK (community_type IN ('discord', 'reddit')),
  community_id VARCHAR(255) NOT NULL,
  admin_user_id UUID REFERENCES users(id),
  filter_criteria JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  subscription_tier VARCHAR(50) CHECK (subscription_tier IN ('basic', 'premium')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(community_type, community_id)
);

CREATE INDEX idx_bot_subs_active ON bot_subscriptions(is_active, community_type);

-- Scraping jobs table
CREATE TABLE scraping_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  jobs_scraped INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraping_jobs_status ON scraping_jobs(status, created_at DESC);
