#!/usr/bin/env python3
"""
database.py
Database layer writing to the Drizzle-managed `jobs` table.

CHANGELOG:
- Added format_vector from utils to safely format pgvector strings
- Added index creation for source_url on startup
- Replaced str() embedding conversions with format_vector()
- Added get_existing_urls() for fast, targeted duplicate filtering
- Fixed remove_duplicates() to delete the older record using created_at 
"""

import logging
from typing import Optional, List, Dict, Any, Set
import asyncpg
from datetime import datetime, timezone

from utils import format_vector

logger = logging.getLogger(__name__)


class Database:
    """
    Database layer with connection pooling and batch operations.

    Writes to Drizzle `jobs` table with columns:
        id (uuid), title, company_name, description, location,
        salary_min, salary_max, job_type, remote, source,
        source_url, embedding (vector 768), skills_required (jsonb),
        experience_required, posted_at, expires_at, is_active,
        employer_id, created_at, updated_at
    """

    def __init__(self, database_url: str):
        self.database_url = database_url
        self.pool: Optional[asyncpg.Pool] = None

    async def connect(self):
        """Initialize connection pool."""
        try:
            self.pool = await asyncpg.create_pool(
                self.database_url,
                min_size=2,
                max_size=10,
                command_timeout=60,
            )
            logger.info("Database connection pool created")

            # Verify the jobs table exists and set up index
            async with self.pool.acquire() as conn:
                exists = await conn.fetchval("""
                    SELECT EXISTS(
                        SELECT 1 FROM information_schema.tables
                        WHERE table_name = 'jobs'
                    )
                """)
                if not exists:
                    raise RuntimeError(
                        "Table 'jobs' does not exist — run Drizzle migrations first"
                    )
                
                # Add index on source_url for O(1) existence checks during batch dedup
                await conn.execute("""
                    CREATE INDEX IF NOT EXISTS idx_jobs_source_url ON jobs(source_url);
                """)
                
                logger.info("Verified jobs table exists and source_url index is ready")

        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise

    # ─── INSERT ───────────────────────────────────────────────────

    async def insert_job(self, job_data: Dict[str, Any]) -> bool:
        """
        Insert a single job. Returns True if inserted, False if duplicate.
        Upserts on source_url to handle re-scrapes gracefully.
        """
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO jobs (
                        id, title, company_name, description, location,
                        salary_min, salary_max, job_type, remote, source,
                        source_url, skills_required, experience_required,
                        posted_at, expires_at, is_active, embedding
                    )
                    VALUES (
                        $1, $2, $3, $4, $5,
                        $6, $7, $8, $9, $10,
                        $11, $12, $13,
                        $14, $15, $16, $17
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        title = EXCLUDED.title,
                        company_name = EXCLUDED.company_name,
                        description = EXCLUDED.description,
                        salary_min = EXCLUDED.salary_min,
                        salary_max = EXCLUDED.salary_max,
                        is_active = TRUE,
                        updated_at = NOW()
                """,
                    job_data.get("id"),
                    job_data.get("title"),
                    job_data.get("company_name"),
                    job_data.get("description"),
                    job_data.get("location"),
                    job_data.get("salary_min"),
                    job_data.get("salary_max"),
                    job_data.get("job_type"),
                    job_data.get("remote", False),
                    job_data.get("source", "hiring_cafe"),
                    job_data.get("source_url"),
                    job_data.get("skills_required"),    # jsonb — pass as text
                    job_data.get("experience_required"),
                    job_data.get("posted_at"),
                    job_data.get("expires_at"),
                    job_data.get("is_active", True),
                    format_vector(job_data.get("embedding")),
                )
                return True
        except asyncpg.exceptions.UniqueViolationError:
            logger.debug(f"Duplicate job: {job_data.get('title')}")
            return False
        except Exception as e:
            logger.error(f"Failed to insert job: {e}")
            return False

    async def insert_jobs_batch(self, jobs: List[Dict[str, Any]]) -> int:
        """Batch insert jobs. Returns count of successfully inserted jobs."""
        if not jobs:
            return 0

        inserted = 0
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                for job in jobs:
                    try:
                        await conn.execute("""
                            INSERT INTO jobs (
                                id, title, company_name, description, location,
                                salary_min, salary_max, job_type, remote, source,
                                source_url, skills_required, experience_required,
                                posted_at, expires_at, is_active, embedding
                            )
                            VALUES (
                                $1, $2, $3, $4, $5,
                                $6, $7, $8, $9, $10,
                                $11, $12, $13,
                                $14, $15, $16, $17
                            )
                            ON CONFLICT (id) DO NOTHING
                        """,
                            job.get("id"),
                            job.get("title"),
                            job.get("company_name"),
                            job.get("description"),
                            job.get("location"),
                            job.get("salary_min"),
                            job.get("salary_max"),
                            job.get("job_type"),
                            job.get("remote", False),
                            job.get("source", "hiring_cafe"),
                            job.get("source_url"),
                            job.get("skills_required"),
                            job.get("experience_required"),
                            job.get("posted_at"),
                            job.get("expires_at"),
                            job.get("is_active", True),
                            format_vector(job.get("embedding")),
                        )
                        inserted += 1
                    except Exception as e:
                        logger.warning(f"Failed to insert job {job.get('id')}: {e}")

        logger.info(f"Batch inserted {inserted}/{len(jobs)} jobs")
        return inserted

    # ─── EMBEDDING OPERATIONS ─────────────────────────────────────

    async def get_jobs_without_embeddings(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch jobs that need embeddings."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, title, description, skills_required,
                       company_name, location
                FROM jobs
                WHERE embedding IS NULL AND is_active = TRUE
                LIMIT $1
            """, limit)
            return [dict(row) for row in rows]

    async def update_embedding(self, job_id: str, embedding: List[float]):
        """Update a single job's embedding."""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                UPDATE jobs
                SET embedding = $1::vector, updated_at = NOW()
                WHERE id = $2
            """, format_vector(embedding), job_id)

    async def update_embeddings_batch(self, updates: List[tuple]):
        """Batch update embeddings. Each tuple is (job_id, embedding_list)."""
        if not updates:
            return

        success = 0
        async with self.pool.acquire() as conn:
            async with conn.transaction():
                for job_id, emb in updates:
                    try:
                        vec_str = format_vector(emb)
                        await conn.execute("""
                            UPDATE jobs
                            SET embedding = $2::vector, updated_at = NOW()
                            WHERE id = $1
                        """, job_id, vec_str)
                        success += 1
                    except Exception as e:
                        logger.warning(f"Failed to update embedding for {job_id}: {e}")

        logger.info(f"Batch updated {success}/{len(updates)} embeddings")

    # ─── SEARCH ───────────────────────────────────────────────────

    async def vector_search(
        self,
        query_embedding: List[float],
        limit: int = 20,
        filters: Optional[Dict[str, Any]] = None,
    ) -> List[Dict[str, Any]]:
        """Perform vector similarity search."""
        async with self.pool.acquire() as conn:
            query = """
                SELECT
                    id, title, company_name, location, job_type,
                    salary_min, salary_max, skills_required, source_url,
                    remote, posted_at,
                    1 - (embedding <=> $1::vector) as similarity
                FROM jobs
                WHERE embedding IS NOT NULL AND is_active = TRUE
            """
            params = [query_embedding]
            param_idx = 2

            if filters:
                if filters.get("remote_only"):
                    query += " AND remote = TRUE"
                if filters.get("job_type"):
                    query += f" AND job_type = ${param_idx}"
                    params.append(filters["job_type"])
                    param_idx += 1

            query += f" ORDER BY embedding <=> $1::vector LIMIT ${param_idx}"
            params.append(limit)

            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]

    async def full_text_search(
        self, query: str, limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Full-text search using PostgreSQL tsvector."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT
                    id, title, company_name, location, job_type,
                    salary_min, salary_max, skills_required, source_url,
                    remote, posted_at,
                    ts_rank(
                        to_tsvector('english',
                            COALESCE(title, '') || ' ' ||
                            COALESCE(description, '') || ' ' ||
                            COALESCE(company_name, '')
                        ),
                        plainto_tsquery('english', $1)
                    ) as rank
                FROM jobs
                WHERE
                    is_active = TRUE AND
                    to_tsvector('english',
                        COALESCE(title, '') || ' ' ||
                        COALESCE(description, '') || ' ' ||
                        COALESCE(company_name, '')
                    ) @@ plainto_tsquery('english', $1)
                ORDER BY rank DESC
                LIMIT $2
            """, query, limit)
            return [dict(row) for row in rows]

    # ─── DEDUPLICATION ────────────────────────────────────────────

    async def get_existing_source_urls(self, source: str = "hiring_cafe") -> set:
        """Get all existing source_urls for a given source — used for dedup."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT source_url FROM jobs WHERE source = $1
            """, source)
            return {row["source_url"] for row in rows if row["source_url"]}

    async def get_existing_urls(self, urls: List[str]) -> Set[str]:
        """Check which of the provided URLs already exist in the database."""
        if not urls:
            return set()
            
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT source_url FROM jobs WHERE source_url = ANY($1)
            """, urls)
            return {row["source_url"] for row in rows if row["source_url"]}

    async def get_all_source_ids(self) -> Set[str]:
        """Fetch all known source_urls for skipping already-scraped jobs across all sources."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT source_url, source FROM jobs WHERE source_url IS NOT NULL"
            )
            ids = set()
            for row in rows:
                url = row["source_url"]
                source = row["source"]
                # Add the full URL for general dedup
                ids.add(url)
                # For hiring.cafe, also extract the requisition_id suffix
                if source == "hiring_cafe" and "/viewjob/" in url:
                    ids.add(url.split("/viewjob/")[-1].split("/")[0])
                # For greenhouse, add the gh-{board}-{id} key
                elif source == "greenhouse":
                    # URL format: https://boards.greenhouse.io/{board}/jobs/{id}
                    parts = url.rstrip("/").split("/")
                    if len(parts) >= 2:
                        try:
                            gh_id = parts[-1]
                            board = parts[-3] if len(parts) >= 4 else ""
                            ids.add(f"gh-{board}-{gh_id}")
                        except (IndexError, ValueError):
                            pass
        return ids

    # ─── CLEANUP ──────────────────────────────────────────────────

    async def cleanup_old_jobs(self, days: int = 30) -> int:
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM jobs
                WHERE created_at < NOW() - MAKE_INTERVAL(days => $1)
            """, days)
            count = int(result.split()[-1])
            logger.info(f"Cleaned up {count} old jobs (> {days} days)")
            return count

    async def cleanup_expired_jobs(self) -> int:
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM jobs
                WHERE expires_at IS NOT NULL AND expires_at < NOW()
            """)
            count = int(result.split()[-1])
            logger.info(f"Cleaned up {count} expired jobs")
            return count

    async def deactivate_stale_jobs(self, days: int = 14) -> int:
        """Mark jobs as inactive if not refreshed recently (across all sources)."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                UPDATE jobs
                SET is_active = FALSE, updated_at = NOW()
                WHERE updated_at < NOW() - MAKE_INTERVAL(days => $1)
                    AND is_active = TRUE
            """, days)
            count = int(result.split()[-1])
            logger.info(f"Deactivated {count} stale jobs (> {days} days)")
            return count

    async def remove_duplicates(self) -> int:
        """Remove duplicate jobs based on identical source_url."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                -- Explaining decision: using created_at to preserve the new scrape data. 
                -- We delete the OLDER record (smaller created_at) when duplicate URLs exist
                -- because id is a UUID type which cannot be ordered reliably by comparison operator.
                DELETE FROM jobs a USING jobs b
                WHERE a.created_at < b.created_at
                AND a.source_url = b.source_url
                AND a.source = b.source
            """)
            count = int(result.split()[-1])
            logger.info(f"Removed {count} duplicate jobs")
            return count

    # ─── STATS ────────────────────────────────────────────────────

    async def get_stats(self) -> Dict[str, Any]:
        async with self.pool.acquire() as conn:
            stats = {}
            stats["total_jobs"] = await conn.fetchval("SELECT COUNT(*) FROM jobs")
            stats["active_jobs"] = await conn.fetchval(
                "SELECT COUNT(*) FROM jobs WHERE is_active = TRUE"
            )
            stats["jobs_with_embeddings"] = await conn.fetchval(
                "SELECT COUNT(*) FROM jobs WHERE embedding IS NOT NULL"
            )
            stats["remote_jobs"] = await conn.fetchval(
                "SELECT COUNT(*) FROM jobs WHERE remote = TRUE"
            )
            # Per-source breakdown
            source_rows = await conn.fetch(
                "SELECT source, COUNT(*) as cnt FROM jobs GROUP BY source"
            )
            stats["by_source"] = {row["source"]: row["cnt"] for row in source_rows}
            return stats

    async def close(self):
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
