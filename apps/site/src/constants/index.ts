import type { Job } from '@/types';

export const MOCK_JOBS: Job[] = Array.from({ length: 18 }).map((_, i) => ({
  id: i + 1,
  company: ['Novalabs', 'Fluxbyte', 'Arcadia', 'Nebula AI'][i % 4],
  title: ['Senior Frontend Engineer', 'Platform Engineer', 'Realtime Systems Engineer'][i % 3],
  comp: ['$140k–$200k', '$160k–$220k', '$170k–$230k'][i % 3],
  loc: ['Remote', 'NYC', 'EU Remote', 'SF'][i % 4],
  tags: [['React','GraphQL','Next.js'], ['Rust','Kafka','AWS'], ['Go','K8s','GCP']][i % 3],
  impact: ['100k DAU','P95 -40%','Zero-downtime deploys'][i % 3],
}));

export const HOW_IT_WORKS_STEPS = [
  { 
    title: 'Upload / Describe', 
    desc: 'Resume, paste, links',
    iconName: 'Upload'
  },
  { 
    title: 'AI Understands', 
    desc: 'Skills, projects, impact',
    iconName: 'Wand2'
  },
  { 
    title: 'Smart Matches', 
    desc: 'Roles, teams, intros',
    iconName: 'Briefcase'
  },
] as const;

export const FILTER_OPTIONS = {
  stack: ['React','Rust','Go','AWS','Next.js','Python'],
  seniority: ['Mid','Senior','Staff'],
  location: ['Remote','US','EU','NYC','SF']
} as const;

export const RECRUIT_LANES = ['New', 'Screen', 'Interview', 'Offer', 'Hired'] as const;

export const AI_SUGGESTIONS = [
  'Senior React + GraphQL • realtime UI performance',
  'Rust backend • streaming systems • AWS',
  'Full‑stack Next.js • design systems • a11y',
] as const;
