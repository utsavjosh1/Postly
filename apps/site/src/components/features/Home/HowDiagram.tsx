'use client';

import React from 'react';
import { Upload, Wand2, Briefcase, GitBranch } from 'lucide-react';
import { HOW_IT_WORKS_STEPS } from '@/constants';

export const HowDiagram: React.FC = () => {
  const iconMap = {
    Upload,
    Wand2,
    Briefcase,
  };

  return (
    <section id="how" className="mx-auto max-w-[1440px] px-6 py-14">
      <div className="rounded-2xl border border-border bg-white/[0.05] backdrop-blur-xl p-6">
        <div className="flex items-center gap-2 text-primary">
          <GitBranch className="w-4 h-4" />
          <div className="text-sm font-medium">How it works</div>
        </div>

        <div className="mt-8 relative">
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="220">
            <defs>
              <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.6" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.6" />
              </linearGradient>
            </defs>
            <path 
              d="M 180 80 C 330 10, 450 10, 600 80" 
              stroke="url(#g)" 
              strokeWidth="2" 
              fill="none" 
              opacity="0.7" 
            />
            <path 
              d="M 600 80 C 740 150, 860 150, 1000 80" 
              stroke="url(#g)" 
              strokeWidth="2" 
              fill="none" 
              opacity="0.7" 
            />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {HOW_IT_WORKS_STEPS.map(({ iconName, title, desc }, idx) => {
              const Icon = iconMap[iconName as keyof typeof iconMap];
              return (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-popover p-5 text-center hover:bg-white/[0.06] transition animate-slide-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="mx-auto h-10 w-10 rounded-full flex items-center justify-center border border-border bg-secondary">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="mt-3 text-sm font-medium">{title}</div>
                  <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
                  {idx === 1 && (
                    <div className="mt-3 flex justify-center gap-2">
                      {['React','Rust','AWS','Impact'].map((tech) => (
                        <span 
                          key={tech} 
                          className="text-[11px] rounded-full border border-border bg-secondary px-2 py-0.5"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 justify-center">
          {['AI‑driven', 'Project‑based', 'Real‑impact', 'Zero‑fluff'].map((tag) => (
            <span 
              key={tag} 
              className="text-xs rounded-full border border-border bg-secondary px-3 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
