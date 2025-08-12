#!/usr/bin/env bun

import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function demonstrateQueries() {
  console.log('🔍 Demonstrating database queries...\n');
  
  try {
    // 1. Get all companies with job counts
    console.log('📊 Companies with job counts:');
    const companies = await prisma.company.findMany({
      include: {
        _count: { select: { jobs: true } }
      },
      orderBy: { name: 'asc' }
    });
    
    companies.forEach(company => {
      console.log(`  • ${company.name} - ${company._count.jobs} jobs (${company.industry || 'Unknown industry'})`);
    });
    
    // 2. Get all jobs with company and skills
    console.log('\n💼 Available jobs:');
    const jobs = await prisma.job.findMany({
      include: {
        company: true,
        skills: { include: { skill: true } }
      },
      orderBy: { postedDate: 'desc' }
    });
    
    jobs.forEach(job => {
      console.log(`\n  📋 ${job.title} at ${job.company.name}`);
      console.log(`     Location: ${job.location || 'Not specified'}`);
      console.log(`     Work Type: ${job.workType}`);
      console.log(`     Seniority: ${job.seniorityLevel || 'Not specified'}`);
      console.log(`     Salary: ${job.salary || 'Not specified'}`);
      
      if (job.skills.length > 0) {
        console.log(`     Skills: ${job.skills.map(s => s.skill.name).join(', ')}`);
      }
    });
    
    // 3. Search for specific skills
    console.log('\n🛠️ Jobs requiring JavaScript:');
    const jsJobs = await prisma.job.findMany({
      where: {
        skills: {
          some: {
            skill: { name: 'JavaScript' }
          }
        }
      },
      include: {
        company: true,
        skills: { include: { skill: true } }
      }
    });
    
    jsJobs.forEach(job => {
      console.log(`  • ${job.title} at ${job.company.name}`);
    });
    
    // 4. Search by work type
    console.log('\n🏠 Remote jobs:');
    const remoteJobs = await prisma.job.findMany({
      where: { workType: 'REMOTE' },
      include: { company: true }
    });
    
    remoteJobs.forEach(job => {
      console.log(`  • ${job.title} at ${job.company.name}`);
    });
    
    // 5. Get skill statistics
    console.log('\n📈 Skill popularity:');
    const skillStats = await prisma.skill.findMany({
      include: {
        _count: { select: { jobs: true } }
      },
      orderBy: {
        jobs: { _count: 'desc' }
      }
    });
    
    skillStats.forEach(skill => {
      if (skill._count.jobs > 0) {
        console.log(`  • ${skill.name}: ${skill._count.jobs} jobs`);
      }
    });
    
    // 6. Company analytics
    console.log('\n🏢 Company analytics:');
    const companyAnalytics = await prisma.company.findMany({
      include: {
        jobs: {
          select: {
            workType: true,
            seniorityLevel: true,
            category: true
          }
        }
      },
      where: {
        jobs: { some: {} } // Only companies with jobs
      }
    });
    
    companyAnalytics.forEach(company => {
      const workTypes = [...new Set(company.jobs.map(j => j.workType))];
      const categories = [...new Set(company.jobs.map(j => j.category).filter(Boolean))];
      
      console.log(`  • ${company.name}:`);
      console.log(`    - ${company.jobs.length} jobs`);
      console.log(`    - Work types: ${workTypes.join(', ')}`);
      if (categories.length > 0) {
        console.log(`    - Categories: ${categories.join(', ')}`);
      }
    });
    
    console.log('\n✅ Query demonstration completed!');
    
  } catch (error) {
    console.error('❌ Query failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  demonstrateQueries();
}
