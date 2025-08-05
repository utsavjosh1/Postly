'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Upload, LayoutGrid, Users, Search, Wand2, Briefcase, MapPin, DollarSign, Star
} from 'lucide-react';
import { AI_SUGGESTIONS } from '@/constants';
import {AIOrb} from "@/components/aiorb"

// Types for better type safety
interface Job {
  title: string;
  meta: string;
  tags: string[];
  location?: string;
  salary?: string;
}

interface SkillPillProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-[1440px] px-6 pt-16 pb-12 lg:pt-24 grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
        <AIWelcome />
        <HeroRight />
      </div>
    </section>
  );
};

const AIWelcome: React.FC = () => {
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestionIndex(prev => (prev + 1) % AI_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-6 shadow-lg">
      <div className="flex items-center gap-4">
        <AIOrb />
        <div>
          <div className="text-sm text-muted-foreground">Welcome to Postly</div>
          <div className="text-lg font-medium text-foreground">AI that hires by proof.</div>
        </div>
      </div>

      <h1 className="mt-6 text-5xl lg:text-6xl font-semibold tracking-tight text-foreground">
        Your work. Your signal.
      </h1>
      <p className="mt-3 text-muted-foreground">
        Upload a resume or describe your projects — matched by skills, projects, and impact.
      </p>

      <form
        className="mt-6 rounded-xl border border-input bg-muted/20 backdrop-blur-sm px-3 py-2"
        onSubmit={(e) => { 
          e.preventDefault(); 
          window.location.href = '/explore';
        }}
      >
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-primary" />
          <input
            placeholder={AI_SUGGESTIONS[currentSuggestionIndex]}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent outline-none placeholder:text-muted-foreground/70 text-sm w-full text-foreground"
          />
          <button 
            type="submit" 
            className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-md border border-primary/20 hover:bg-primary/20 transition-all duration-200"
          >
            Search
          </button>
        </div>
      </form>

      <div className="mt-6 grid sm:grid-cols-3 gap-3">
        <Link href="/upload">
          <button className="retro-button retro-border inline-flex items-center justify-center gap-2 h-11 rounded-md text-sm font-medium w-full text-primary hover:text-primary-foreground transition-all duration-200">
            <Upload className="w-4 h-4" /> Upload Resume
          </button>
        </Link>
        <Link href="/explore">
          <button className="inline-flex items-center justify-center gap-2 h-11 rounded-md text-sm border border-border bg-secondary/50 hover:bg-secondary text-secondary-foreground w-full transition-all duration-200">
            <LayoutGrid className="w-4 h-4" /> Explore Jobs
          </button>
        </Link>
        <button 
          className="inline-flex items-center justify-center gap-2 h-11 rounded-md text-sm border border-muted bg-muted/30 text-muted-foreground relative opacity-60 cursor-not-allowed"
          disabled
          title="Coming Soon"
        >
          <Users className="w-4 h-4" /> Community
          <span className="absolute -top-2 -right-2 text-xs bg-chart-2/20 text-chart-2 px-2 py-0.5 rounded-full border border-chart-2/30 font-medium">
            Soon
          </span>
        </button>
      </div>
    </div>
  );
};

// Reusable SkillPill component
const SkillPill: React.FC<SkillPillProps> = ({ children, className = "", style }) => {
  return (
    <span className={`text-xs rounded-full border border-border bg-secondary text-secondary-foreground px-3 py-1 animate-slide-up shadow-sm ${className}`} style={style}>
      {children}
    </span>
  );
};

// Reusable JobCard component
const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  return (
    <div className="rounded-xl border border-border bg-card hover:bg-accent/50 transition-all duration-200 p-4 group shadow-sm">
      <div className="flex items-start justify-between">
        <div className="font-medium text-sm text-card-foreground">{job.title}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {job.meta}
        </div>
      </div>
      
      <div className="mt-2 flex flex-wrap gap-2">
        {job.tags.map(tag => (
          <span 
            key={tag} 
            className="text-xs rounded-md bg-secondary text-secondary-foreground px-2 py-1 border border-border"
          >
            {tag}
          </span>
        ))}
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <Link href="/explore">
          <button className="h-9 px-3 rounded-md border border-border bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground text-xs transition-all duration-200 flex items-center gap-1">
            <Star className="w-3 h-3" />
            View matches
          </button>
        </Link>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <DollarSign className="w-3 h-3" />
          Competitive
        </div>
      </div>
    </div>
  );
};

const HeroRight: React.FC = () => {
  const [parsing, setParsing] = useState(false);
  const [skills, setSkills] = useState<string[]>([]);
  const [log, setLog] = useState<string[]>([]);

  const startParse = () => {
    setParsing(true);
    setSkills([]);
    setLog([]);
    
    const queue = [
      'postly> upload Resume.pdf … done',
      'postly> parsing projects … 3 repos',
      'postly> skills: React · Rust · AWS',
      'postly> impact: 100k+ MAU · P95 -40%',
      'postly> matches: Senior Frontend · Platform',
    ];
    
    queue.forEach((line, i) => 
      setTimeout(() => setLog(prev => [...prev, line]), 250 * (i + 1))
    );
    
    const pills = ['React', 'Rust', 'AWS', 'Kafka', '100k+ MAU', 'Latency -40%'];
    pills.forEach((pill, i) => 
      setTimeout(() => setSkills(prev => [...prev, pill]), 400 + i * 220)
    );
    
    setTimeout(() => setParsing(false), 2200);
  };

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Quick parse preview</div>
          <Wand2 className="w-4 h-4 text-primary" />
        </div>
        
        <div className="mt-3 rounded-lg border border-border bg-muted/30 backdrop-blur-sm p-4 font-mono text-sm min-h-[148px] retro-terminal">
          {log.map((line, i) => (
            <div 
              key={i} 
              className="opacity-90 animate-slide-up text-foreground" 
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {line}
            </div>
          ))}
          {parsing && <div className="text-primary mt-1 animate-pulse">▌</div>}
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <SkillPill 
              key={skill} 
              className="animate-slide-up" 
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {skill}
            </SkillPill>
          ))}
        </div>
        
        <div className="mt-4 flex gap-2">
          <button 
            onClick={startParse} 
            className="h-10 px-4 rounded-md bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={parsing}
          >
            <Wand2 className={`w-4 h-4 ${parsing ? 'animate-spin' : ''}`} />
            {parsing ? 'Parsing...' : 'Run demo parse'}
          </button>
          <Link href="/upload">
            <button className="h-10 px-4 rounded-md border border-border bg-secondary/50 hover:bg-secondary text-secondary-foreground transition-all duration-200 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Open parser
            </button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-6 shadow-lg">
        <div className="flex items-center gap-2 text-primary">
          <Briefcase className="w-4 h-4" />
          <div className="text-sm font-medium">Project‑based Roles</div>
        </div>
        
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {[
            { 
              title: 'Senior Frontend Engineer', 
              meta: 'Remote • $160k–$220k', 
              tags: ['React','GraphQL','Next.js'] 
            },
            { 
              title: 'Platform Engineer', 
              meta: 'EU Remote • $170k–$230k', 
              tags: ['Rust','Kafka','AWS'] 
            },
          ].map((job) => (
            <JobCard key={job.title} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
};
