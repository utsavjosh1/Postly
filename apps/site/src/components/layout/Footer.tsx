'use client';

import React from 'react';
import { Github, Twitter, LineChart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-[1440px] px-6 py-10">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded border border-border bg-white/[0.06]" />
            <span>© {new Date().getFullYear()} Postly</span>
          </div>
          <div className="flex items-center gap-3">
            <Github className="w-4 h-4" />
            <Twitter className="w-4 h-4" />
            <LineChart className="w-4 h-4" />
          </div>
        </div>
      </div>
    </footer>
  );
};
