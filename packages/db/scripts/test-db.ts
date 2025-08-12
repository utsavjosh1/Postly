#!/usr/bin/env bun

import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('🔗 Testing database connection...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connected successfully!');
    
    // Test table creation
    const companyCount = await prisma.company.count();
    const jobCount = await prisma.job.count();
    const skillCount = await prisma.skill.count();
    
    console.log(`📊 Current data:`);
    console.log(`   Companies: ${companyCount}`);
    console.log(`   Jobs: ${jobCount}`);
    console.log(`   Skills: ${skillCount}`);
    
    // Test creating a sample company
    const testCompany = await prisma.company.upsert({
      where: { name: 'Test Company' },
      update: {},
      create: {
        name: 'Test Company',
        industry: 'Technology',
        website: 'https://example.com'
      }
    });
    console.log(`✅ Test company created/found: ${testCompany.id}`);
    
    // Test creating a sample skill
    const testSkill = await prisma.skill.upsert({
      where: { name: 'JavaScript' },
      update: {},
      create: {
        name: 'JavaScript',
        category: 'Programming Language'
      }
    });
    console.log(`✅ Test skill created/found: ${testSkill.id}`);
    
    console.log('🎉 All tests passed! Database schema is working correctly.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

if (import.meta.main) {
  testConnection();
}
