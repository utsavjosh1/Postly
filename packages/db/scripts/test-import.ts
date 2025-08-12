#!/usr/bin/env bun

import { PrismaClient } from '../src/generated/client';
import fs from 'fs/promises';

const prisma = new PrismaClient();

// Create a small test dataset
const testData = {
  "jobs": [
    {
      "id": "test_job_1",
      "title": "Software Engineer",
      "coreTitle": "Software Engineer",
      "company": "Test Tech Corp",
      "companyWebsite": "https://testtech.com",
      "location": "San Francisco, CA",
      "workType": "Remote",
      "jobType": ["Full Time"],
      "experience": "3+ years",
      "managementExperience": "Not specified",
      "category": "Software Development",
      "roleType": "Individual Contributor",
      "seniorityLevel": "Mid Level",
      "skills": ["JavaScript", "React", "Node.js"],
      "description": "We are looking for a talented Software Engineer to join our team.",
      "requirements": "3+ years experience with JavaScript and React",
      "salary": "$120k-$150k",
      "applyUrl": "https://testtech.com/jobs/1",
      "postedDate": "2025-08-05T16:30:45.519Z",
      "companyInfo": {
        "tagline": "Leading technology solutions",
        "industry": "Information Technology",
        "employees": 500,
        "founded": 2015,
        "headquarters": "United States",
        "isPublic": false
      }
    },
    {
      "id": "test_job_2", 
      "title": "Marketing Manager",
      "coreTitle": "Marketing Manager",
      "company": "Growth Marketing Inc",
      "location": "New York, NY",
      "workType": "Hybrid",
      "jobType": ["Full Time"],
      "experience": "5+ years",
      "category": "Marketing",
      "roleType": "People Manager",
      "seniorityLevel": "Senior Level",
      "skills": ["Analytics", "Growth Strategy", "Digital Marketing"],
      "description": "Lead our marketing efforts and drive growth.",
      "requirements": "5+ years marketing experience",
      "salary": "Not specified",
      "applyUrl": "https://growthmarketing.com/jobs/2",
      "postedDate": "2025-08-04T10:00:00.000Z",
      "companyInfo": {
        "tagline": "Driving business growth through marketing",
        "industry": "Marketing", 
        "employees": 100,
        "founded": 2020,
        "headquarters": "United States",
        "isPublic": false
      }
    }
  ]
};

async function testImport() {
  console.log('🧪 Testing import with sample data...');
  
  try {
    // Write test data to a temporary file
    const testFile = 'test-jobs.json';
    await fs.writeFile(testFile, JSON.stringify(testData, null, 2));
    
    // Import the test data using our import script
    const { importJobs } = await import('./import-jobs.js');
    await importJobs(testFile);
    
    // Verify the import
    const companies = await prisma.company.findMany({
      include: { _count: { select: { jobs: true } } }
    });
    
    const jobs = await prisma.job.findMany({
      include: {
        company: true,
        skills: { include: { skill: true } }
      }
    });
    
    console.log('\n📊 Import Results:');
    console.log(`Companies: ${companies.length}`);
    companies.forEach(company => {
      console.log(`  - ${company.name} (${company._count.jobs} jobs)`);
    });
    
    console.log(`\nJobs: ${jobs.length}`);
    jobs.forEach(job => {
      console.log(`  - ${job.title} at ${job.company.name}`);
      console.log(`    Skills: ${job.skills.map(s => s.skill.name).join(', ')}`);
    });
    
    // Clean up test file
    await fs.unlink(testFile);
    
    console.log('\n✅ Test import completed successfully!');
    
  } catch (error) {
    console.error('❌ Test import failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  testImport();
}
