'use client';

import React from 'react';
import { Github, Twitter, Heart } from 'lucide-react';
import Link from 'next/link';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-border/20 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand Section */}
            <div className="flex items-center gap-3 group">
              <Link href="/" className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-xl border border-primary/25 bg-primary/8 backdrop-blur retro-border flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-sm">
                  <div className="h-3.5 w-3.5 rounded-md bg-gradient-to-br from-primary to-accent" />
                </div>
                <span className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">Postly</span>
              </Link>
            </div>

            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {new Date().getFullYear()} Postly. Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>by the team</span>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              <Link 
                href="https://github.com/utsavjosh1/postly" 
                className="p-2.5 rounded-xl border border-border/25 bg-background/60 hover:bg-secondary/50 hover:border-border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm flex items-center justify-center shadow-sm group"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </Link>
              <Link 
                href="https://twitter.com/utsavjosh1" 
                className="p-2.5 rounded-xl border border-border/25 bg-background/60 hover:bg-secondary/50 hover:border-border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm flex items-center justify-center shadow-sm group"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
