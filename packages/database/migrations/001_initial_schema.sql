-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255), -- Nullable for Google Auth users
  google_id VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  role VARCHAR(50) NOT NULL CHECK (role IN ('job_seeker', 'employer', 'admin')) DEFAULT 'job_seeker',
  is_verified BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_google_id ON users(google_id);

-- User Preferences (Nurturing)
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  search_preferences JSONB DEFAULT '{}'::jsonb, -- e.g. { "locations": [], "roles": [], "salary_min": 0 }
  notification_settings JSONB DEFAULT '{}'::jsonb,
  ui_preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Limits
CREATE TABLE rate_limits (
  key VARCHAR(255) PRIMARY KEY, -- e.g. "ip:127.0.0.1:login" or "user:uuid:chat"
  count INT DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_rate_limits_reset ON rate_limits(reset_at);

-- Resumes table
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  file_url TEXT NOT NULL,
  parsed_text TEXT,
  embedding VECTOR(768),
  skills JSONB, -- storing extracted skills as JSON array
  experience_years INT,
  education JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resumes_user ON resumes(user_id);
CREATE INDEX idx_resumes_embedding ON resumes USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_resumes_skills ON resumes USING GIN (skills);

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
CREATE INDEX idx_jobs_skills ON jobs USING GIN (skills_required);

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

-- Chat System
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id, updated_at DESC);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB, -- For citations, tool calls, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at ASC);

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

