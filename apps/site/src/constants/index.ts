import type { Job } from "@/types";

export const MOCK_JOBS: Job[] = Array.from({ length: 18 }).map((_, i) => ({
  id: (i + 1).toString(),
  title: [
    "Senior Frontend Engineer",
    "Platform Engineer",
    "Realtime Systems Engineer",
  ][i % 3],
  description:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  location: ["Remote", "NYC", "EU Remote", "SF"][i % 4],
  workType: (["REMOTE", "ONSITE", "HYBRID", "FLEXIBLE"] as const)[i % 4],
  jobTypes: [["FULL_TIME"], ["PART_TIME"], ["CONTRACT"], ["INTERNSHIP"]][
    i % 4
  ] as (
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "TEMPORARY"
    | "INTERNSHIP"
    | "FREELANCE"
    | "VOLUNTEER"
    | "SEASONAL"
    | "UNKNOWN"
  )[],
  seniorityLevel: (
    ["ENTRY_LEVEL", "MID_LEVEL", "SENIOR_LEVEL", "STAFF_LEVEL"] as const
  )[i % 4],
  salary: ["$140k–$200k", "$160k–$220k", "$170k–$230k"][i % 3],
  applyUrl: `https://example.com/jobs/${i + 1}`,
  postedDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  company: {
    id: ((i % 4) + 1).toString(),
    name: ["Novalabs", "Fluxbyte", "Arcadia", "Nebula AI"][i % 4],
    website: `https://${["novalabs", "fluxbyte", "arcadia", "nebula-ai"][i % 4]}.com`,
    industry: ["Technology", "Software", "AI/ML", "Cloud"][i % 4],
    employees: [100, 500, 1000, 5000][i % 4],
    logo: undefined,
  },
  skills: [
    [
      { id: "1", name: "React", category: "Frontend" },
      { id: "2", name: "GraphQL", category: "API" },
      { id: "3", name: "Next.js", category: "Framework" },
    ],
    [
      { id: "4", name: "Rust", category: "Backend" },
      { id: "5", name: "Kafka", category: "Messaging" },
      { id: "6", name: "AWS", category: "Cloud" },
    ],
    [
      { id: "7", name: "Go", category: "Backend" },
      { id: "8", name: "K8s", category: "DevOps" },
      { id: "9", name: "GCP", category: "Cloud" },
    ],
  ][i % 3],
}));

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Upload / Describe",
    desc: "Resume, paste, links",
    iconName: "Upload",
  },
  {
    title: "AI Understands",
    desc: "Skills, projects, impact",
    iconName: "Wand2",
  },
  {
    title: "Smart Matches",
    desc: "Roles, teams, intros",
    iconName: "Briefcase",
  },
] as const;

export const FILTER_OPTIONS = {
  stack: ["React", "Rust", "Go", "AWS", "Next.js", "Python"],
  seniority: ["Mid", "Senior", "Staff"],
  location: ["Remote", "US", "EU", "NYC", "SF"],
} as const;

export const RECRUIT_LANES = [
  "New",
  "Screen",
  "Interview",
  "Offer",
  "Hired",
] as const;

export const AI_SUGGESTIONS = [
  "Marketing Manager • growth strategy • team leadership",
  "Sales Director • B2B relationships • revenue growth",
  "Project Manager • stakeholder coordination • delivery",
  "Data Analyst • insights • business intelligence",
  "HR Manager • talent acquisition • culture building",
] as const;
