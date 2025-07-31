-- Supabase Database Schema for Job Scraper
-- Run this in your Supabase SQL Editor

-- Create the jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    url TEXT NOT NULL UNIQUE,
    tags TEXT[] DEFAULT '{}',
    description TEXT,
    salary_range TEXT,
    employment_type TEXT,
    experience_level TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    source TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_company ON jobs(company);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_scraped_at ON jobs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source);
CREATE INDEX IF NOT EXISTS idx_jobs_tags ON jobs USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_jobs_title ON jobs USING GIN(to_tsvector('english', title));

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for recent jobs (last 7 days)
CREATE OR REPLACE VIEW recent_jobs AS
SELECT *
FROM jobs
WHERE scraped_at >= NOW() - INTERVAL '7 days'
ORDER BY scraped_at DESC;

-- Optional: Create a table for scraping results/logs
CREATE TABLE IF NOT EXISTS scraping_results (
    id BIGSERIAL PRIMARY KEY,
    total_jobs_found INTEGER NOT NULL DEFAULT 0,
    jobs_saved INTEGER NOT NULL DEFAULT 0,
    jobs_filtered INTEGER NOT NULL DEFAULT 0,
    success_rate DECIMAL(5,2) NOT NULL DEFAULT 0.0,
    duration_seconds DECIMAL(10,3) NOT NULL DEFAULT 0.0,
    errors TEXT[] DEFAULT '{}',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for scraping results
CREATE INDEX IF NOT EXISTS idx_scraping_results_timestamp ON scraping_results(timestamp DESC);

-- Optional: Create a function to get job statistics
CREATE OR REPLACE FUNCTION get_job_stats(days INTEGER DEFAULT 1)
RETURNS TABLE(
    total_jobs BIGINT,
    unique_companies BIGINT,
    unique_locations BIGINT,
    top_companies JSON,
    top_locations JSON,
    common_tags JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) AS total_jobs,
            COUNT(DISTINCT company) AS unique_companies,
            COUNT(DISTINCT location) AS unique_locations
        FROM jobs 
        WHERE scraped_at >= NOW() - (days || ' days')::INTERVAL
    ),
    top_companies AS (
        SELECT json_agg(json_build_object('company', company, 'count', cnt)) AS companies_json
        FROM (
            SELECT company, COUNT(*) AS cnt
            FROM jobs 
            WHERE scraped_at >= NOW() - (days || ' days')::INTERVAL
            GROUP BY company
            ORDER BY COUNT(*) DESC
            LIMIT 10
        ) t
    ),
    top_locations AS (
        SELECT json_agg(json_build_object('location', location, 'count', cnt)) AS locations_json
        FROM (
            SELECT location, COUNT(*) AS cnt
            FROM jobs 
            WHERE scraped_at >= NOW() - (days || ' days')::INTERVAL
            GROUP BY location
            ORDER BY COUNT(*) DESC
            LIMIT 10
        ) t
    ),
    common_tags AS (
        SELECT json_agg(json_build_object('tag', tag, 'count', cnt)) AS tags_json
        FROM (
            SELECT unnest(tags) AS tag, COUNT(*) AS cnt
            FROM jobs 
            WHERE scraped_at >= NOW() - (days || ' days')::INTERVAL
            AND tags IS NOT NULL
            GROUP BY tag
            ORDER BY COUNT(*) DESC
            LIMIT 15
        ) t
    )
    SELECT 
        s.total_jobs,
        s.unique_companies,
        s.unique_locations,
        tc.companies_json,
        tl.locations_json,
        ct.tags_json
    FROM stats s
    CROSS JOIN top_companies tc
    CROSS JOIN top_locations tl
    CROSS JOIN common_tags ct;
END;
$$ LANGUAGE plpgsql;

-- Create Row Level Security (RLS) policies if needed
-- ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE scraping_results ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON jobs TO authenticated;
-- GRANT SELECT ON recent_jobs TO authenticated;

-- Sample query to test the setup
-- SELECT * FROM get_job_stats(7);
