#!/usr/bin/env bun

import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...\n');
  
  try {
    // Get current counts
    const beforeCounts = {
      jobs: await prisma.job.count(),
      companies: await prisma.company.count(),
      skills: await prisma.skill.count(),
      jobSkills: await prisma.jobSkill.count()
    };
    
    console.log('📊 Before cleanup:');
    console.log(`   Jobs: ${beforeCounts.jobs}`);
    console.log(`   Companies: ${beforeCounts.companies}`);
    console.log(`   Skills: ${beforeCounts.skills}`);
    console.log(`   Job-Skill links: ${beforeCounts.jobSkills}\n`);
    
    // Clean up in proper order (respecting foreign key constraints)
    console.log('🗑️ Removing job-skill relationships...');
    await prisma.jobSkill.deleteMany({});
    
    console.log('🗑️ Removing jobs...');
    await prisma.job.deleteMany({});
    
    console.log('🗑️ Removing orphaned skills...');
    await prisma.skill.deleteMany({
      where: {
        jobs: { none: {} },
        userSkills: { none: {} }
      }
    });
    
    console.log('🗑️ Removing companies with no jobs...');
    await prisma.company.deleteMany({
      where: {
        jobs: { none: {} }
      }
    });
    
    // Get final counts
    const afterCounts = {
      jobs: await prisma.job.count(),
      companies: await prisma.company.count(),
      skills: await prisma.skill.count(),
      jobSkills: await prisma.jobSkill.count()
    };
    
    console.log('\n📊 After cleanup:');
    console.log(`   Jobs: ${afterCounts.jobs}`);
    console.log(`   Companies: ${afterCounts.companies}`);
    console.log(`   Skills: ${afterCounts.skills}`);
    console.log(`   Job-Skill links: ${afterCounts.jobSkills}\n`);
    
    console.log('✅ Database cleanup completed!');
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] !== '--confirm') {
    console.log('⚠️  This script will delete ALL job-related data from the database!');
    console.log('');
    console.log('To proceed, run: bun scripts/cleanup-db.ts --confirm');
    console.log('');
    console.log('Note: This will NOT delete user accounts, sessions, or authentication data.');
    process.exit(0);
  }
  
  await cleanupDatabase();
}

if (import.meta.main) {
  main();
}
