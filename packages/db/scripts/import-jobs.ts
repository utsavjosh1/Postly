#!/usr/bin/env bun

import { PrismaClient } from '../src/generated/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Types for the job data structure
interface RawJobData {
  id: string;
  title: string;
  coreTitle?: string;
  company: string;
  companyWebsite?: string;
  location?: string;
  workType: string;
  jobType: string[];
  experience?: string;
  managementExperience?: string;
  category?: string;
  roleType?: string;
  seniorityLevel?: string;
  skills: string[];
  description?: string;
  requirements?: string;
  salary?: string;
  applyUrl?: string;
  postedDate?: string;
  companyInfo?: {
    tagline?: string;
    industry?: string;
    employees?: number;
    founded?: number;
    headquarters?: string;
    isPublic?: boolean;
  };
}

interface RawData {
  jobs: RawJobData[];
  timestamp?: string;
  source?: string;
}

// Utility functions for data transformation
const transformWorkType = (workType: string) => {
  const normalized = workType?.toUpperCase();
  switch (normalized) {
    case 'REMOTE': return 'REMOTE';
    case 'ONSITE': return 'ONSITE';
    case 'HYBRID': return 'HYBRID';
    case 'FLEXIBLE': return 'FLEXIBLE';
    default: return 'UNKNOWN';
  }
};

const transformJobTypes = (jobTypes: string[]) => {
  return jobTypes.map(type => {
    const normalized = type?.toUpperCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'FULL_TIME': return 'FULL_TIME';
      case 'PART_TIME': return 'PART_TIME';
      case 'CONTRACT': return 'CONTRACT';
      case 'TEMPORARY': return 'TEMPORARY';
      case 'INTERNSHIP': return 'INTERNSHIP';
      case 'FREELANCE': return 'FREELANCE';
      case 'VOLUNTEER': return 'VOLUNTEER';
      case 'SEASONAL': return 'SEASONAL';
      default: return 'UNKNOWN';
    }
  });
};

const transformRoleType = (roleType?: string) => {
  if (!roleType) return null;
  const normalized = roleType.toUpperCase().replace(/\s+/g, '_');
  switch (normalized) {
    case 'INDIVIDUAL_CONTRIBUTOR': return 'INDIVIDUAL_CONTRIBUTOR';
    case 'PEOPLE_MANAGER': return 'PEOPLE_MANAGER';
    case 'TECHNICAL_LEAD': return 'TECHNICAL_LEAD';
    case 'EXECUTIVE': return 'EXECUTIVE';
    case 'CONSULTANT': return 'CONSULTANT';
    default: return 'UNKNOWN';
  }
};

const transformSeniorityLevel = (level?: string) => {
  if (!level) return null;
  const normalized = level.toUpperCase().replace(/\s+/g, '_');
  switch (normalized) {
    case 'INTERN': return 'INTERN';
    case 'ENTRY_LEVEL': return 'ENTRY_LEVEL';
    case 'MID_LEVEL': return 'MID_LEVEL';
    case 'SENIOR_LEVEL': return 'SENIOR_LEVEL';
    case 'STAFF_LEVEL': return 'STAFF_LEVEL';
    case 'PRINCIPAL_LEVEL': return 'PRINCIPAL_LEVEL';
    case 'DIRECTOR_LEVEL': return 'DIRECTOR_LEVEL';
    case 'VP_LEVEL': return 'VP_LEVEL';
    case 'C_LEVEL': return 'C_LEVEL';
    default: return 'UNKNOWN';
  }
};

const parseSalary = (salaryStr?: string) => {
  if (!salaryStr || salaryStr === 'Not specified' || salaryStr.toLowerCase().includes('not specified')) {
    return { min: null, max: null, currency: null };
  }

  // Remove common prefixes and clean the string
  const cleaned = salaryStr
    .replace(/[₹$€£¥]/g, '') // Remove currency symbols
    .replace(/,/g, '')        // Remove commas
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();

  // Extract currency from original string
  let currency = null;
  if (salaryStr.includes('$')) currency = 'USD';
  else if (salaryStr.includes('₹')) currency = 'INR';
  else if (salaryStr.includes('€')) currency = 'EUR';
  else if (salaryStr.includes('£')) currency = 'GBP';
  else if (salaryStr.includes('¥')) currency = 'JPY';

  // Try to extract salary range
  const rangeMatch = cleaned.match(/(\d+)(?:k|K)?.*?(?:–|-|to)\s*(\d+)(?:k|K)?/);
  if (rangeMatch) {
    let min = parseInt(rangeMatch[1]);
    let max = parseInt(rangeMatch[2]);
    
    // Handle k/K suffix
    if (salaryStr.toLowerCase().includes('k')) {
      min *= 1000;
      max *= 1000;
    }
    
    return { min, max, currency };
  }

  // Try to extract single salary
  const singleMatch = cleaned.match(/(\d+)(?:k|K)?/);
  if (singleMatch) {
    let amount = parseInt(singleMatch[1]);
    if (salaryStr.toLowerCase().includes('k')) {
      amount *= 1000;
    }
    return { min: amount, max: amount, currency };
  }

  return { min: null, max: null, currency };
};

const cleanString = (str?: string) => {
  if (!str) return null;
  return str.trim() || null;
};

const parseDate = (dateStr?: string) => {
  if (!dateStr) return null;
  try {
    return new Date(dateStr);
  } catch {
    return null;
  }
};

// Main import function
async function importJobs(filePath: string) {
  console.log('🚀 Starting job import process...');
  
  try {
    // Read and parse the JSON file
    console.log(`📂 Reading file: ${filePath}`);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data: RawData = JSON.parse(fileContent);
    
    if (!data.jobs || !Array.isArray(data.jobs)) {
      throw new Error('Invalid data format: missing jobs array');
    }

    console.log(`📊 Found ${data.jobs.length} jobs to import`);

    // Process companies first to avoid duplicates
    console.log('🏢 Processing companies...');
    const companyMap = new Map<string, string>();
    
    for (const job of data.jobs) {
      if (!companyMap.has(job.company)) {
        const companyData = {
          name: job.company,
          website: cleanString(job.companyWebsite),
          tagline: cleanString(job.companyInfo?.tagline),
          industry: cleanString(job.companyInfo?.industry),
          employees: job.companyInfo?.employees || null,
          founded: job.companyInfo?.founded || null,
          headquarters: cleanString(job.companyInfo?.headquarters),
          isPublic: job.companyInfo?.isPublic || false,
        };

        const company = await prisma.company.upsert({
          where: { name: job.company },
          update: companyData,
          create: companyData,
        });

        companyMap.set(job.company, company.id);
      }
    }

    console.log(`✅ Processed ${companyMap.size} unique companies`);

    // Process skills
    console.log('🛠️ Processing skills...');
    const skillMap = new Map<string, string>();
    const allSkills = new Set<string>();
    
    data.jobs.forEach(job => {
      job.skills?.forEach(skill => allSkills.add(skill.trim()));
    });

    for (const skillName of allSkills) {
      if (skillName && !skillMap.has(skillName)) {
        const skill = await prisma.skill.upsert({
          where: { name: skillName },
          update: {},
          create: { name: skillName },
        });
        skillMap.set(skillName, skill.id);
      }
    }

    console.log(`✅ Processed ${skillMap.size} unique skills`);

    // Process jobs in batches
    console.log('💼 Processing jobs...');
    const batchSize = 100;
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < data.jobs.length; i += batchSize) {
      const batch = data.jobs.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (job) => {
          try {
            const salary = parseSalary(job.salary);
            const companyId = companyMap.get(job.company);
            
            if (!companyId) {
              throw new Error(`Company not found: ${job.company}`);
            }

            // Create or update job
            await prisma.job.upsert({
              where: { id: job.id },
              update: {
                title: job.title,
                coreTitle: cleanString(job.coreTitle),
                description: cleanString(job.description),
                requirements: cleanString(job.requirements),
                location: cleanString(job.location),
                workType: transformWorkType(job.workType),
                jobTypes: transformJobTypes(job.jobType || []),
                experience: cleanString(job.experience),
                managementExperience: cleanString(job.managementExperience),
                category: cleanString(job.category),
                roleType: transformRoleType(job.roleType),
                seniorityLevel: transformSeniorityLevel(job.seniorityLevel),
                salary: cleanString(job.salary),
                salaryMin: salary.min,
                salaryMax: salary.max,
                salaryCurrency: salary.currency,
                applyUrl: cleanString(job.applyUrl),
                postedDate: parseDate(job.postedDate),
                companyId,
              },
              create: {
                id: job.id,
                title: job.title,
                coreTitle: cleanString(job.coreTitle),
                description: cleanString(job.description),
                requirements: cleanString(job.requirements),
                location: cleanString(job.location),
                workType: transformWorkType(job.workType),
                jobTypes: transformJobTypes(job.jobType || []),
                experience: cleanString(job.experience),
                managementExperience: cleanString(job.managementExperience),
                category: cleanString(job.category),
                roleType: transformRoleType(job.roleType),
                seniorityLevel: transformSeniorityLevel(job.seniorityLevel),
                salary: cleanString(job.salary),
                salaryMin: salary.min,
                salaryMax: salary.max,
                salaryCurrency: salary.currency,
                applyUrl: cleanString(job.applyUrl),
                postedDate: parseDate(job.postedDate),
                companyId,
              },
            });

            // Add skills for this job
            if (job.skills && job.skills.length > 0) {
              // Remove existing job-skill relationships
              await prisma.jobSkill.deleteMany({
                where: { jobId: job.id },
              });

              // Add new job-skill relationships
              const jobSkills = job.skills
                .filter(skill => skill.trim() && skillMap.has(skill.trim()))
                .map(skill => ({
                  jobId: job.id,
                  skillId: skillMap.get(skill.trim())!,
                }));

              if (jobSkills.length > 0) {
                await prisma.jobSkill.createMany({
                  data: jobSkills,
                  skipDuplicates: true,
                });
              }
            }

            processed++;
            if (processed % 50 === 0) {
              console.log(`📈 Processed ${processed}/${data.jobs.length} jobs`);
            }
          } catch (error) {
            errors++;
            console.error(`❌ Error processing job ${job.id}:`, error);
          }
        })
      );
    }

    console.log(`\n🎉 Import completed!`);
    console.log(`✅ Successfully processed: ${processed} jobs`);
    console.log(`❌ Errors: ${errors} jobs`);
    console.log(`🏢 Companies: ${companyMap.size}`);
    console.log(`🛠️ Skills: ${skillMap.size}`);

  } catch (error) {
    console.error('💥 Fatal error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: bun run import-jobs.ts <path-to-json-file>');
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  
  // Check if file exists
  try {
    await fs.access(filePath);
  } catch {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    await importJobs(filePath);
    console.log('🚀 All done!');
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  main();
}

export { importJobs };
