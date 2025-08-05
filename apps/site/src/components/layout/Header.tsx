'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, ArrowRight, Sparkles
} from 'lucide-react';
import { cx } from '@/lib/utils';

interface NavItemProps {
  href: string;
  label: string;
  pathname: string;
  onCloseMobile?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ 
  href, 
  label, 
  pathname, 
  onCloseMobile 
}) => (
  <Link
    href={href}
    onClick={onCloseMobile}
    className={cx(
      'text-sm px-3 py-2 rounded-md transition',
      pathname === href 
        ? 'bg-white/10 text-foreground' 
        : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
    )}
  >
    {label}
  </Link>
);

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  return (
    <header className="sticky top-0 z-50 backdrop-blur border-b border-border bg-background/70">
      <div className="mx-auto max-w-[1440px] h-16 px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md border border-border bg-white/[0.06] backdrop-blur retro-border" />
          <span className="font-semibold tracking-tight">Postly</span>
          <span className="ml-2 hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Matching
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          <NavItem 
            href="/" 
            label="Home" 
            pathname={pathname}
          />
          <NavItem 
            href="/explore" 
            label="Job Explorer" 
            pathname={pathname}
          />
          <NavItem 
            href="/upload" 
            label="Resume Upload" 
            pathname={pathname}
          />
          <NavItem 
            href="/recruiters" 
            label="Recruiter Dashboard" 
            pathname={pathname}
          />
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/upload"
            className="retro-button retro-border inline-flex items-center gap-2 h-10 px-4 text-sm font-medium cursor-pointer"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 rounded border border-border"
          onClick={toggleMobile}
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background/90">
          <div className="px-4 py-3 grid gap-2">
            <NavItem 
              href="/" 
              label="Home" 
              pathname={pathname}
              onCloseMobile={toggleMobile}
            />
            <NavItem 
              href="/explore" 
              label="Job Explorer" 
              pathname={pathname}
              onCloseMobile={toggleMobile}
            />
            <NavItem 
              href="/upload" 
              label="Resume Upload" 
              pathname={pathname}
              onCloseMobile={toggleMobile}
            />
            <NavItem 
              href="/recruiters" 
              label="Recruiter Dashboard" 
              pathname={pathname}
              onCloseMobile={toggleMobile}
            />
            <Link
              href="/upload"
              className="retro-button retro-border inline-flex items-center justify-center gap-2 h-10 mt-2"
              onClick={toggleMobile}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
