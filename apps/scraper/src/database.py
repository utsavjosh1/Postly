#!/usr/bin/env python3
"""
database.py
Database layer with proper schema and connection pooling.
"""

import asyncio
import logging
from typing import Optional, List, Dict, Any
import asyncpg
from datetime import datetime

logger = logging.getLogger(__name__)

class Database:
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
            
            # Create jobs table with proper constraints
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS jobs (
                    id SERIAL PRIMARY KEY,
                    title TEXT NOT NULL,
                    company_name TEXT,
                    description TEXT NOT NULL,
                    url TEXT UNIQUE NOT NULL,
                    salary TEXT,
                    location TEXT,
                    remote BOOLEAN DEFAULT FALSE,
                    meta JSONB DEFAULT '{}',
                    embedding vector(768),
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    CONSTRAINT valid_title CHECK (char_length(title) > 5),
                    CONSTRAINT valid_description CHECK (char_length(description) > 100),
                    CONSTRAINT valid_url CHECK (url ~* '^https?://')
                )
            """)
            
            # Create indexes for performance
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC)
            """)
            await conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_jobs_embedding ON jobs USING ivfflat (embedding vector_cosine_ops)
                WITH (lists = 100)
            """)
            
            logger.info("Database schema initialized")
    
    async def insert_job(self, job_data: Dict[str, Any]) -> bool:
        """
        Insert a job into the database.
        Returns True if inserted, False if duplicate or validation failed.
        """
        try:
            async with self.pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO jobs (title, company_name, description, url, salary, location, remote, meta, embedding)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)
                    ON CONFLICT (url) DO NOTHING
                """, 
                    job_data.get('title'),
                    job_data.get('company'),
                    job_data.get('description'),
                    job_data.get('url'),
                    job_data.get('salary'),
                    job_data.get('location'),
                    job_data.get('remote', False),
                    job_data.get('meta', {}),
                    job_data.get('embedding')
                )
                return True
        except asyncpg.exceptions.CheckViolationError as e:
            logger.warning(f"Job validation failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Failed to insert job: {e}")
            return False
    
    async def get_jobs_without_embeddings(self, limit: int = 100) -> List[Dict[str, Any]]:
        """Fetch jobs that need embeddings."""
        async with self.pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT id, title, description, url
                FROM jobs
                WHERE embedding IS NULL
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
    
    async def cleanup_old_jobs(self, days: int = 30):
        """Delete jobs older than specified days."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM jobs
                WHERE created_at < NOW() - INTERVAL '%s days'
            """ % days)
            logger.info(f"Cleaned up old jobs: {result}")
    
    async def remove_duplicates(self):
        """Remove duplicate jobs based on description similarity."""
        async with self.pool.acquire() as conn:
            result = await conn.execute("""
                DELETE FROM jobs a USING jobs b
                WHERE a.id > b.id 
                AND a.description = b.description
            """)
            logger.info(f"Removed duplicates: {result}")
    
    async def sanitize_descriptions(self):
        """Clean up common junk patterns in descriptions."""
        async with self.pool.acquire() as conn:
            await conn.execute("""
                UPDATE jobs
                SET description = REGEXP_REPLACE(description, 'Share this job.*', '', 'gi')
                WHERE description ~* 'Share this job'
            """)
            await conn.execute("""
                UPDATE jobs
                SET description = REGEXP_REPLACE(description, 'Apply now.*', '', 'gi')
                WHERE description ~* 'Apply now'
            """)
            logger.info("Sanitized job descriptions")
    
    async def close(self):
        """Close database connection pool."""
        if self.pool:
            await self.pool.close()
            logger.info("Database connection pool closed")
