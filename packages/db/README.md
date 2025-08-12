# Job Bot Database

A comprehensive database schema for a universal hiring platform built with Prisma and PostgreSQL.

## 📋 Schema Overview

### Core Models

#### 🏢 **Company**
- Complete company information with metadata
- Support for public/private companies
- Industry categorization
- Employee count and founding year

#### 💼 **Job**
- Comprehensive job details with flexible fields
- Support for all job types (Full-time, Part-time, Contract, etc.)
- Work arrangements (Remote, Onsite, Hybrid, Flexible)
- Salary parsing with min/max ranges and currency support
- Experience levels and seniority mapping
- Full-text search capabilities

#### 🛠️ **Skill**
- Normalized skill management
- Many-to-many relationship with jobs and users
- Skill categorization support

#### 👤 **User & Profiles**
- OAuth authentication support (existing)
- Comprehensive user profiles with preferences
- Job application tracking
- Saved jobs functionality
- User skill proficiency levels

### 🎯 Key Features

1. **Edge Case Handling**
   - Nullable fields where data might be missing
   - Flexible enums with UNKNOWN fallbacks
   - Salary parsing for various formats
   - Date validation and error handling

2. **Performance Optimizations**
   - Strategic database indexes
   - Batch processing for imports
   - Upsert operations to handle duplicates

3. **Data Integrity**
   - Foreign key constraints
   - Unique constraints where needed
   - Cascade deletes for cleanup

## 🚀 Quick Start

### 1. Setup Database

```bash
# Navigate to db package
cd packages/db

# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# (Optional) View database in Prisma Studio
npx prisma studio
```

### 2. Import Job Data

```bash
# Import from JSON file
npm run db:import ../sima/outputs/hiring-cafe-api-jobs.json

# Or run directly with bun
bun run scripts/import-jobs.ts ../sima/outputs/hiring-cafe-api-jobs.json
```

### 3. Use in Your Application

```typescript
import { PrismaClient } from '@repo/db';

const prisma = new PrismaClient();

// Search jobs with filters
const jobs = await prisma.job.findMany({
  where: {
    workType: 'REMOTE',
    seniorityLevel: 'SENIOR_LEVEL',
    skills: {
      some: {
        skill: {
          name: { in: ['React', 'TypeScript'] }
        }
      }
    }
  },
  include: {
    company: true,
    skills: {
      include: { skill: true }
    }
  },
  orderBy: { postedDate: 'desc' },
  take: 20
});
```

## 📊 Data Import Script Features

### Intelligent Data Transformation

1. **Company Deduplication**
   - Automatically merges companies with same name
   - Updates company info from latest job data

2. **Skill Normalization**
   - Creates unique skill entries
   - Links skills to jobs via junction table

3. **Salary Parsing**
   ```typescript
   // Handles various formats:
   "$120k-$150k" → { min: 120000, max: 150000, currency: "USD" }
   "₹8-12 LPA"   → { min: 800000, max: 1200000, currency: "INR" }
   "Not specified" → { min: null, max: null, currency: null }
   ```

4. **Enum Mapping**
   - Maps string values to proper enum types
   - Handles case variations and spaces
   - Defaults to UNKNOWN for unmapped values

5. **Error Handling**
   - Continues processing on individual job errors
   - Logs detailed error information
   - Provides summary statistics

### Batch Processing
- Processes jobs in batches of 100
- Uses Promise.allSettled for fault tolerance
- Progress reporting every 50 processed jobs

## 🔍 Example Queries

### Find Remote React Jobs
```typescript
const reactJobs = await prisma.job.findMany({
  where: {
    workType: 'REMOTE',
    skills: {
      some: {
        skill: { name: 'React' }
      }
    }
  },
  include: {
    company: true,
    skills: { include: { skill: true } }
  }
});
```

### Get User Applications
```typescript
const userApplications = await prisma.jobApplication.findMany({
  where: { userId: 'user-id' },
  include: {
    job: {
      include: { company: true }
    }
  },
  orderBy: { appliedAt: 'desc' }
});
```

### Search by Salary Range
```typescript
const highPayingJobs = await prisma.job.findMany({
  where: {
    salaryMin: { gte: 100000 },
    salaryCurrency: 'USD'
  }
});
```

### Company Analytics
```typescript
const companyStats = await prisma.company.findMany({
  include: {
    jobs: {
      select: {
        id: true,
        seniorityLevel: true,
        workType: true
      }
    },
    _count: {
      select: { jobs: true }
    }
  },
  orderBy: {
    jobs: { _count: 'desc' }
  },
  take: 10
});
```

## 🛠️ Maintenance

### Regular Tasks

1. **Update Job Data**
   ```bash
   # Re-run import with latest data
   npm run db:import path/to/latest-jobs.json
   ```

2. **Clean Old Jobs**
   ```typescript
   // Remove jobs older than 6 months
   await prisma.job.deleteMany({
     where: {
       postedDate: {
         lt: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000)
       }
     }
   });
   ```

3. **Skill Cleanup**
   ```typescript
   // Remove skills not associated with any jobs
   await prisma.skill.deleteMany({
     where: {
       jobs: { none: {} },
       userSkills: { none: {} }
     }
   });
   ```

## 📈 Performance Notes

- **Indexes**: Added on frequently queried fields
- **Batch Size**: Optimized for 100 jobs per batch
- **Memory Usage**: Streams large files instead of loading entirely
- **Connection Pooling**: Uses Supabase connection pooling

## 🔧 Troubleshooting

### Common Issues

1. **Import Fails**
   - Check database connection
   - Verify JSON file format
   - Review error logs for specific issues

2. **Slow Queries**
   - Add indexes for new query patterns
   - Use `EXPLAIN ANALYZE` to check query plans
   - Consider pagination for large result sets

3. **Duplicate Data**
   - Script handles duplicates via upsert
   - Check for data integrity issues in source

## 🚀 Next Steps

1. **Add Full-Text Search**
   ```sql
   -- Add to PostgreSQL directly
   ALTER TABLE jobs ADD COLUMN search_vector tsvector;
   CREATE INDEX jobs_search_idx ON jobs USING gin(search_vector);
   ```

2. **Add Job Matching Algorithm**
   - Implement similarity scoring
   - User preference matching
   - Machine learning recommendations

3. **Analytics Dashboard**
   - Job market trends
   - Salary analysis
   - Skill demand tracking

## 📄 License

This database schema is part of the JobBot project and follows the same license terms.
