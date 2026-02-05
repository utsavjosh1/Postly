#!/usr/bin/env python3
"""
database.py
Database layer with complete job schema and optimized batch operations.
"""

import asyncio
import logging
import json
from typing import Optional, List, Dict, Any
import asyncpg
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class Database:
    """Database layer with connection pooling and batch operations."""

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Initialize connection pool and create schema."""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60
            )
            logger.info("Database connection pool created")
            await self._init_schema()
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    async def _init_schema(self):
        """Create tables and indexes if they don't exist."""
        async with self.pool.acquire() as conn:
            # Enable pgvector extension
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")

            # Create jobs table with COMPLETE schema per requirements
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id SERIAL PRIMARY KEY,
                    
                    -- Core job fields (required)
                    job_id TEXT UNIQUE NOT NULL,
                    job_title TEXT NOT NULL,
                    company_name TEXT,
                    location TEXT,
                    job_type TEXT,
                    industry TEXT,
                    salary_range TEXT,
                    experience_required TEXT,
                    skills_required TEXT[],
                    job_description TEXT NOT NULL,
                    application_link TEXT NOT NULL,
                    job_source TEXT NOT NULL,
                    posting_date DATE,
                    expiry_date DATE,
                    employment_mode TEXT,
                    remote_status TEXT DEFAULT 'unknown',
                    
                    -- Metadata
                    meta JSONB DEFAULT '{}',
                    scraped_timestamp TIMESTAMPTZ DEFAULT NOW(),
                    
                    -- Vector embedding (1536 for OpenAI, 768 for Gemini)
                    embedding vector(768),
                    
                    -- Timestamps
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    
                    -- Validation status
                    is_valid BOOLEAN DEFAULT TRUE,
                    validation_errors TEXT[],
                    last_validated_at TIMESTAMPTZ,
                    
                    -- Constraints
                    CONSTRAINT valid_title CHECK (char_length(job_title) > 5),
                    CONSTRAINT valid_description CHECK (char_length(job_description) > 100),
                    CONSTRAINT valid_url CHECK (application_link ~* '^https?://')
                )
            """)

            # Create indexes for performance
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_created_at 
                ON jobs(created_at DESC)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_job_source 
                ON jobs(job_source)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_expiry 
                ON jobs(expiry_date) WHERE expiry_date IS NOT NULL
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_industry 
                ON jobs(industry) WHERE industry IS NOT NULL
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_remote 
                ON jobs(remote_status)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_skills 
                ON jobs USING GIN(skills_required)
            """)

            # HNSW index for vector search (better than IVFFlat)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_embedding_hnsw 
                ON jobs USING hnsw (embedding vector_cosine_ops)
                WITH (m = 16, ef_construction = 64)
            """)

            # Full-text search index
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_fts 
                ON jobs USING GIN(
                    to_tsvector('english', 
                        COALESCE(job_title, '') || ' ' || 
                        COALESCE(job_description, '') || ' ' ||
                        COALESCE(company_name, '')
                    )
                )
            """)

            logger.info("Database schema initialized with complete job fields")

    async def insert_job(self, job_data: Dict[str, Any]) -> bool:
        """
        Insert a job into the database.
        Returns True if inserted, False if duplicate or validation failed.
        """
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO jobs (
                        job_id, job_title, company_name, location, job_type,
                        industry, salary_range, experience_required, skills_required,
                        job_description, application_link, job_source,
                        posting_date, expiry_date, employment_mode, remote_status,
                        meta, embedding
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::vector)
                    ON CONFLICT (job_id) DO UPDATE SET
                        job_title = EXCLUDED.job_title,
                        company_name = EXCLUDED.company_name,
                        job_description = EXCLUDED.job_description,
                        salary_range = EXCLUDED.salary_range,
                        updated_at = NOW()
                """,
                    job_data.get('job_id'),
                    job_data.get('job_title'),
                    job_data.get('company_name'),
                    job_data.get('location'),
                    job_data.get('job_type'),
                    job_data.get('industry'),
                    job_data.get('salary_range'),
                    job_data.get('experience_required'),
                    job_data.get('skills_required', []),
                    job_data.get('job_description'),
                    job_data.get('application_link'),
                    job_data.get('job_source'),
                    job_data.get('posting_date'),
                    job_data.get('expiry_date'),
                    job_data.get('employment_mode'),
                    job_data.get('remote_status', 'unknown'),
                    json.dumps(job_data.get('meta', {})),
                    job_data.get('embedding')
                )
                return True
        except asyncpg.exceptions.CheckViolationError as e:
            logger.warning(f"Job validation failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to insert job: {e}")
            return False

    async def insert_jobs_batch(self, jobs: List[Dict[str, Any]]) -> int:
        """
        Batch insert jobs for better performance.
        Returns count of successfully inserted jobs.
        """
        if not jobs:
            return 0

        inserted = 0
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                for job in jobs:
                    try:
                        await conn.execute("""
                            INSERT INTO jobs (
                                job_id, job_title, company_name, location, job_type,
                                industry, salary_range, experience_required, skills_required,
                                job_description, application_link, job_source,
                                posting_date, expiry_date, employment_mode, remote_status,
                                meta, embedding
                            )
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::vector)
                            ON CONFLICT (job_id) DO NOTHING
                        """,
                            job.get('job_id'),
                            job.get('job_title'),
                            job.get('company_name'),
                            job.get('location'),
                            job.get('job_type'),
                            job.get('industry'),
                            job.get('salary_range'),
                            job.get('experience_required'),
                            job.get('skills_required', []),
                            job.get('job_description'),
                            job.get('application_link'),
                            job.get('job_source'),
                            job.get('posting_date'),
                            job.get('expiry_date'),
                            job.get('employment_mode'),
                            job.get('remote_status', 'unknown'),
                            json.dumps(job.get('meta', {})),
                            job.get('embedding')
                        )
                        inserted += 1
                    except Exception as e:
                        logger.warning(f"Failed to insert job {job.get('job_id')}: {e}")

        logger.info(f"Batch inserted {inserted}/{len(jobs)} jobs")
        return inserted

    async def get_jobs_without_embeddings(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch jobs that need embeddings."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, job_id, job_title, job_description, skills_required, 
                       company_name, industry
                FROM jobs
                WHERE embedding IS NULL AND is_valid = TRUE
                LIMIT $1
            """, limit)
            return [dict(row) for row in rows]

    async def update_embedding(self, job_id: int, embedding: List[float]):
        """Update job embedding."""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                UPDATE jobs
                SET embedding = $1::vector, updated_at = NOW()
                WHERE id = $2
            """, embedding, job_id)

    async def update_embeddings_batch(self, updates: List[tuple]):
        """Batch update embeddings. Each tuple is (job_id, embedding)."""
        async with self.pool.acquire() as conn:
            await conn.executemany("""
                UPDATE jobs
                SET embedding = $2::vector, updated_at = NOW()
                WHERE id = $1
            """, updates)
        logger.info(f"Batch updated {len(updates)} embeddings")

    async def vector_search(
        self,
        query_embedding: List[float],
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform vector similarity search.
        Returns jobs sorted by similarity.
        """
        async with self.pool.acquire() as conn:
            # Base query
            query = """
                SELECT 
                    id, job_id, job_title, company_name, location, job_type,
                    industry, salary_range, skills_required, application_link,
                    remote_status, posting_date,
                    1 - (embedding <=> $1::vector) as similarity
                FROM jobs
                WHERE embedding IS NOT NULL AND is_valid = TRUE
            """
            params = [query_embedding]
            param_idx = 2

            # Apply filters
            if filters:
                if filters.get('remote_only'):
                    query += f" AND remote_status = 'remote'"
                if filters.get('industry'):
                    query += f" AND industry = ${param_idx}"
                    params.append(filters['industry'])
                    param_idx += 1
                if filters.get('job_type'):
                    query += f" AND job_type = ${param_idx}"
                    params.append(filters['job_type'])
                    param_idx += 1

            query += f" ORDER BY embedding <=> $1::vector LIMIT ${param_idx}"
            params.append(limit)

            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]

    async def full_text_search(
        self,
        query: str,
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """
        Full-text search using PostgreSQL tsvector.
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    id, job_id, job_title, company_name, location, job_type,
                    industry, salary_range, skills_required, application_link,
                    remote_status, posting_date,
                    ts_rank(
                        to_tsvector('english', 
                            COALESCE(job_title, '') || ' ' || 
                            COALESCE(job_description, '') || ' ' ||
                            COALESCE(company_name, '')
                        ),
                        plainto_tsquery('english', $1)
                    ) as rank
                FROM jobs
                WHERE 
                    is_valid = TRUE AND
                    to_tsvector('english', 
                        COALESCE(job_title, '') || ' ' || 
                        COALESCE(job_description, '') || ' ' ||
                        COALESCE(company_name, '')
                    ) @@ plainto_tsquery('english', $1)
                ORDER BY rank DESC
                LIMIT $2
            """, query, limit)
            return [dict(row) for row in rows]

    async def find_fuzzy_duplicates(
        self,
        job_title: str,
        company_name: str,
        location: str
    ) -> List[Dict[str, Any]]:
        """Find potential duplicate jobs using fuzzy matching."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, job_id, job_title, company_name, location
                FROM jobs
                WHERE 
                    LOWER(job_title) = LOWER($1) AND
                    LOWER(COALESCE(company_name, '')) = LOWER(COALESCE($2, '')) AND
                    LOWER(COALESCE(location, '')) = LOWER(COALESCE($3, ''))
            """, job_title, company_name, location)
            return [dict(row) for row in rows]

    # ==================== CLEANUP METHODS ====================

    async def cleanup_old_jobs(self, days: int = 30) -> int:
        """Delete jobs older than specified days."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM jobs
                WHERE created_at < NOW() - INTERVAL '%s days'
            """ % days)
            count = int(result.split()[-1])
            logger.info(f"Cleaned up {count} old jobs (> {days} days)")
            return count

    async def cleanup_expired_jobs(self) -> int:
        """Remove jobs past their expiry date."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM jobs
                WHERE expiry_date IS NOT NULL AND expiry_date < CURRENT_DATE
            """)
            count = int(result.split()[-1])
            logger.info(f"Cleaned up {count} expired jobs")
            return count

    async def mark_invalid_jobs(self, job_ids: List[str], reason: str):
        """Mark jobs as invalid with reason (for 404s, spam, etc.)."""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                UPDATE jobs
                SET 
                    is_valid = FALSE,
                    validation_errors = array_append(validation_errors, $2),
                    last_validated_at = NOW()
                WHERE job_id = ANY($1)
            """, job_ids, reason)
            logger.info(f"Marked {len(job_ids)} jobs as invalid: {reason}")

    async def remove_duplicates(self) -> int:
        """Remove duplicate jobs based on description similarity."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM jobs a USING jobs b
                WHERE a.id > b.id 
                AND a.job_description = b.job_description
            """)
            count = int(result.split()[-1])
            logger.info(f"Removed {count} duplicate jobs")
            return count

    async def remove_invalid_jobs(self, batch_size: int = 500) -> int:
        """Remove jobs marked as invalid in batches."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM jobs
                WHERE id IN (
                    SELECT id FROM jobs 
                    WHERE is_valid = FALSE 
                    LIMIT $1
                )
            """, batch_size)
            count = int(result.split()[-1])
            logger.info(f"Removed {count} invalid jobs")
            return count

    async def cleanup_orphan_embeddings(self) -> int:
        """Set embeddings to NULL for jobs that will be re-embedded."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                UPDATE jobs
                SET embedding = NULL
                WHERE is_valid = FALSE OR job_description IS NULL
            """)
            count = int(result.split()[-1])
            logger.info(f"Cleaned up {count} orphan embeddings")
            return count

    async def sanitize_descriptions(self):
        """Clean up common junk patterns in descriptions."""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                UPDATE jobs
                SET description = REGEXP_REPLACE(job_description, 'Share this job.*', '', 'gi')
                WHERE job_description ~* 'Share this job'
            """)
            await conn.execute("""
                UPDATE jobs
                SET job_description = REGEXP_REPLACE(job_description, 'Apply now.*', '', 'gi')
                WHERE job_description ~* 'Apply now'
            """)
            logger.info("Sanitized job descriptions")

    async def get_jobs_for_validation(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Get jobs that need URL validation."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, job_id, application_link
                FROM jobs
                WHERE 
                    is_valid = TRUE AND
                    (last_validated_at IS NULL OR 
                     last_validated_at < NOW() - INTERVAL '7 days')
                ORDER BY last_validated_at NULLS FIRST
                LIMIT $1
            """, limit)
            return [dict(row) for row in rows]

    async def update_validation_status(
        self,
        job_id: str,
        is_valid: bool,
        error: Optional[str] = None
    ):
        """Update job validation status."""
        async with self.pool.acquire() as conn:
            if is_valid:
                await conn.execute("""
                    UPDATE jobs
                    SET is_valid = TRUE, last_validated_at = NOW()
                    WHERE job_id = $1
                """, job_id)
            else:
                await conn.execute("""
                    UPDATE jobs
                    SET 
                        is_valid = FALSE,
                        validation_errors = array_append(validation_errors, $2),
                        last_validated_at = NOW()
                    WHERE job_id = $1
                """, job_id, error)

    async def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        async with self.pool.acquire() as conn:
            stats = {}
            stats['total_jobs'] = await conn.fetchval("SELECT COUNT(*) FROM jobs")
            stats['valid_jobs'] = await conn.fetchval(
                "SELECT COUNT(*) FROM jobs WHERE is_valid = TRUE"
            )
            stats['jobs_with_embeddings'] = await conn.fetchval(
                "SELECT COUNT(*) FROM jobs WHERE embedding IS NOT NULL"
            )
            stats['expired_jobs'] = await conn.fetchval(
                "SELECT COUNT(*) FROM jobs WHERE expiry_date < CURRENT_DATE"
            )
            stats['remote_jobs'] = await conn.fetchval(
                "SELECT COUNT(*) FROM jobs WHERE remote_status = 'remote'"
            )
            return stats

    async def close(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
