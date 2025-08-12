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
    <section id="how" className="mx-auto max-w-[1440px] px-6 py-16">
      <div className="rounded-2xl border border-border/25 bg-card/60 backdrop-blur-xl p-8 shadow-lg hover:shadow-xl transition-all duration-500 group">
        <div className="flex items-center gap-2.5 text-primary mb-8">
          <GitBranch className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
          <div className="text-sm font-semibold">How it works</div>
        </div>

        <div className="relative">
          <svg className="absolute inset-0 pointer-events-none" width="100%" height="240">
            <defs>
              <linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path 
              d="M 180 80 C 330 10, 450 10, 600 80" 
              stroke="url(#g)" 
              strokeWidth="2.5" 
              fill="none" 
              opacity="0.9" 
            />
            <path 
              d="M 600 80 C 740 150, 860 150, 1000 80" 
              stroke="url(#g)" 
              strokeWidth="2.5" 
              fill="none" 
              opacity="0.9" 
            />
          </svg>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {HOW_IT_WORKS_STEPS.map(({ iconName, title, desc }, index) => {
              const Icon = iconMap[iconName as keyof typeof iconMap];
              return (
                <div
                  key={title}
                  className="rounded-xl border border-border/25 bg-background/60 hover:bg-background/80 p-6 text-center hover:shadow-md transition-all duration-300 animate-slide-up backdrop-blur-sm group/step"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center border border-primary/25 bg-primary/8 shadow-sm group-hover/step:shadow-md transition-all duration-300 group-hover/step:scale-110">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="mt-4 text-sm font-semibold text-foreground">{title}</div>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 justify-center">
          {['AI‑driven', 'Project‑based', 'Real‑impact', 'Zero‑fluff'].map((tag, index) => (
            <span 
              key={tag} 
              className="text-xs rounded-lg border border-primary/20 bg-primary/8 text-primary px-3 py-1.5 font-medium shadow-sm hover:shadow-md transition-all duration-200 animate-slide-up backdrop-blur-sm"
              style={{ animationDelay: `${index * 50 + 300}ms` }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
