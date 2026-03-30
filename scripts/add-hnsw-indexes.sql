-- ──────────────────────────────────────────────────────────
-- HNSW Vector Indexes for pgvector
-- ──────────────────────────────────────────────────────────
-- Uses HNSW (Hierarchical Navigable Small World) instead of
-- IVFFlat for better recall and no training step required.
--
-- m=16, ef_construction=64 is a good balance for <100k rows.
-- All embedding columns are 1024 dimensions (Voyage AI).
-- ──────────────────────────────────────────────────────────

-- Resumes: used for resume-to-job matching
CREATE INDEX CONCURRENTLY IF NOT EXISTS resumes_embedding_hnsw
ON resumes USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Jobs: used for job-to-resume matching and job search
CREATE INDEX CONCURRENTLY IF NOT EXISTS jobs_embedding_hnsw
ON jobs USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Employer Profiles: used for company similarity search
CREATE INDEX CONCURRENTLY IF NOT EXISTS employer_profiles_embedding_hnsw
ON employer_profiles USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Seeker Profiles: used for candidate matching
CREATE INDEX CONCURRENTLY IF NOT EXISTS seeker_profiles_embedding_hnsw
ON seeker_profiles USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
