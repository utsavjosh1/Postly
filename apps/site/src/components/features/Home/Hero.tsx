"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  LayoutGrid,
  Users,
  Search,
  Wand2,
  Briefcase,
  MapPin,
  DollarSign,
  Star,
} from "lucide-react";

import { AI_SUGGESTIONS } from "@/constants";
import { AIOrb } from "@/components/aiorb";

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
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

      <div className="relative mx-auto max-w-[1440px] px-6 pt-20 pb-16 lg:pt-28 lg:pb-20 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-start">
        <AIWelcome />
        <HeroRight />
      </div>
    </section>
  );
};

const AIWelcome: React.FC = () => {
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSuggestionIndex((prev) => (prev + 1) % AI_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-2xl border border-border/25 bg-card/60 backdrop-blur-xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-500 group">
      <div className="flex items-center gap-4">
        <AIOrb />
        <div>
          <div className="text-sm text-muted-foreground font-medium">
            Welcome to Postly
          </div>
          <div className="text-lg font-semibold text-foreground">
            AI that hires by proof.
          </div>
        </div>
      </div>

      <h1 className="mt-8 text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
        Your work. <span className="text-primary">Your signal.</span>
      </h1>
      <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-lg">
        Discover opportunities matched by skills, projects, and measurable
        impact. Start exploring roles that value real work over keywords.
      </p>

      <div className="mt-8 rounded-xl border border-input/50 bg-background/60 backdrop-blur-sm px-4 py-3 shadow-sm hover:shadow-md transition-shadow duration-300 group/search">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            window.location.href = "/explore";
          }}
        >
          <div className="flex items-center gap-3">
            <input
              placeholder={AI_SUGGESTIONS[currentSuggestionIndex]}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent outline-none placeholder:text-muted-foreground/80 text-sm w-full text-foreground font-medium placeholder:transition-colors placeholder:duration-300"
            />
            <button type="submit" className="flex-shrink-0 p-1">
              <Search className="w-4 h-4 text-primary hover:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </form>
      </div>

      <div className="mt-8 grid sm:grid-cols-3 gap-4">
        <Link href="/explore" className="block">
          <button className="retro-button retro-border inline-flex items-center justify-center gap-2.5 h-12 rounded-xl text-sm font-semibold w-full text-primary hover:text-primary-foreground transition-colors duration-300 shadow-sm hover:shadow-md">
            <LayoutGrid className="w-4 h-4" />
            Explore Jobs
          </button>
        </Link>
        <div className="relative">
          <button
            className="inline-flex items-center justify-center gap-2.5 h-12 rounded-xl text-sm font-semibold border border-border/25 bg-muted/40 text-muted-foreground w-full cursor-not-allowed opacity-60 backdrop-blur-sm"
            disabled
            title="Coming Soon"
          >
            <Upload className="w-4 h-4" />
            Upload Resume
          </button>
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-50 text-xs font-bold px-2 py-1 rounded-full border border-yellow-400 shadow-sm animate-pulse pointer-events-none">
            Soon
          </div>
        </div>
        <div className="relative">
          <button
            className="inline-flex items-center justify-center gap-2.5 h-12 rounded-xl text-sm font-semibold border border-border/25 bg-muted/40 text-muted-foreground w-full cursor-not-allowed opacity-60 backdrop-blur-sm"
            disabled
            title="Coming Soon"
          >
            <Users className="w-4 h-4" />
            Join Community
          </button>
          <div className="absolute -top-2 -right-2 bg-yellow-500 text-yellow-50 text-xs font-bold px-2 py-1 rounded-full border border-yellow-400 shadow-sm animate-pulse pointer-events-none">
            Soon
          </div>
        </div>
      </div>
    </div>
  );
};

// Reusable SkillPill component
const SkillPill: React.FC<SkillPillProps> = ({
  children,
  className = "",
  style,
}) => {
  return (
    <span
      className={`text-xs rounded-lg border border-primary/20 bg-primary/8 text-primary px-3 py-1.5 animate-slide-up shadow-sm font-medium backdrop-blur-sm ${className}`}
      style={style}
    >
      {children}
    </span>
  );
};

// Reusable JobCard component
const JobCard: React.FC<{ job: Job }> = ({ job }) => {
  return (
    <div className="rounded-xl border border-border/25 bg-background/60 hover:bg-background/80 transition-colors duration-300 p-4 shadow-sm hover:shadow-md cursor-pointer backdrop-blur-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="font-semibold text-sm text-foreground hover:text-primary transition-colors duration-200">
          {job.title}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          {job.meta}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {job.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs rounded-md bg-primary/8 text-primary border border-primary/20 px-2 py-1 font-medium"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border/20">
        <Link href="/explore" className="block">
          <button className="h-8 px-3 rounded-lg border border-primary/25 bg-primary/5 text-primary hover:bg-primary hover:text-primary-foreground text-xs transition-colors duration-200 flex items-center gap-1.5 font-medium shadow-sm">
            <Star className="w-3 h-3" />
            View matches
          </button>
        </Link>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
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
      "postly> upload Resume.pdf … done",
      "postly> parsing experience … 5 years",
      "postly> skills: Leadership  · Strategy",
      "postly> impact: Team growth +40% · Revenue +2M",
      "postly> matches: Project Manager · Sales Lead",
    ];

    queue.forEach((line, i) =>
      setTimeout(() => setLog((prev) => [...prev, line]), 250 * (i + 1)),
    );

    const pills = [
      "Leadership",
      "Strategy",
      "Communication",
      "Team growth +40%",
      "Revenue +2M",
    ];
    pills.forEach((pill, i) =>
      setTimeout(() => setSkills((prev) => [...prev, pill]), 400 + i * 220),
    );

    setTimeout(() => setParsing(false), 2200);
  };

  return (
    <div className="grid gap-6">
      {/* Demo Parse Card */}
      <div className="rounded-2xl border border-border/25 bg-card/60 backdrop-blur-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-500">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground font-medium">
            Quick parse preview
          </div>
          <Wand2 className="w-4 h-4 text-primary hover:rotate-12 transition-transform duration-300" />
        </div>

        <div className="rounded-xl border border-border/25 bg-background/60 backdrop-blur-sm p-4 font-mono text-sm min-h-[160px] retro-terminal shadow-inner">
          {log.map((line, i) => (
            <div
              key={i}
              className="opacity-90 animate-slide-up text-foreground mb-1"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {line}
            </div>
          ))}
          {parsing && (
            <div className="text-primary mt-2 animate-pulse font-bold">▌</div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill, i) => (
            <SkillPill
              key={skill}
              className="animate-slide-up shadow-sm hover:shadow-md transition-shadow duration-200"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              {skill}
            </SkillPill>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={startParse}
            className="h-11 px-5 rounded-xl bg-primary/10 border border-primary/25 text-primary hover:bg-primary hover:text-primary-foreground transition-colors duration-300 flex items-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-sm hover:shadow-md backdrop-blur-sm"
            disabled={parsing}
          >
            <Wand2 className={`w-4 h-4 ${parsing ? "animate-spin" : ""}`} />
            {parsing ? "Parsing..." : "Run demo parse"}
          </button>
          <Link href="/explore" className="block">
            <button className="h-11 px-5 rounded-xl border border-border/25 bg-secondary/60 hover:bg-secondary/80 text-secondary-foreground transition-colors duration-300 flex items-center gap-2.5 font-semibold text-sm shadow-sm hover:shadow-md backdrop-blur-sm">
              <LayoutGrid className="w-4 h-4" />
              Explore jobs
            </button>
          </Link>
        </div>
      </div>

      {/* All Professions Card */}
      <div className="rounded-2xl border border-border/25 bg-card/60 backdrop-blur-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-500">
        <div className="flex items-center gap-2.5 text-primary mb-5">
          <Briefcase className="w-4 h-4 hover:scale-110 transition-transform duration-300" />
          <div className="text-sm font-semibold">All Professions</div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {[
            {
              title: "Marketing Manager",
              meta: "Remote • $95k–$130k",
              tags: ["Strategy", "Analytics", "Growth"],
            },
            {
              title: "Sales Director",
              meta: "Hybrid • $120k–$180k",
              tags: ["Leadership", "B2B", "CRM"],
            },
          ].map((job) => (
            <JobCard key={job.title} job={job} />
          ))}
        </div>
      </div>
    </div>
  );
};
