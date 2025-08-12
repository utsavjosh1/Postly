'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, ArrowRight, LogIn, User, LogOut
} from 'lucide-react';
import { cx } from '@/lib/utils';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


interface NavItemProps {
  href: string;
  label: string;
  pathname: string;
  onCloseMobile?: () => void;
  isComingSoon?: boolean;
}

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  
  if (!isOpen) return null;

  const handleGoogleLogin = () => {
    login();
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
      <div className="relative bg-card/95 border border-border/50 rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl animate-scale-in backdrop-blur-sm">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-muted/40 transition-colors duration-200 focus:outline-none focus:ring-1 focus:ring-primary/40 flex items-center justify-center"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
        
        <div className="text-center">
          <div className="mb-5">
            <div className="h-12 w-12 mx-auto rounded-full bg-primary/8 flex items-center justify-center mb-3 ring-1 ring-primary/10">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-medium text-card-foreground mb-1.5">Welcome to Postly</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in to upload your resume and discover opportunities that match your skills
            </p>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg px-5 py-3 flex items-center justify-center gap-2.5 transition-all duration-300 font-medium text-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1 focus:ring-offset-card group"
          >
            <svg className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
          
          <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
            By continuing, you agree to our{' '}
            <button className="text-primary hover:underline focus:outline-none focus:underline transition-colors">
              terms
            </button>
            {' '}and{' '}
            <button className="text-primary hover:underline focus:outline-none focus:underline transition-colors">
              privacy policy
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

// User Dropdown Component
const UserDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl border border-border/25 bg-background/60 hover:bg-secondary/50 hover:border-border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm shadow-sm group"
      >
        <Avatar className="w-6 h-6 border border-primary/20">
          <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
            {user.name?.charAt(0).toUpperCase() || <User className="w-3 h-3" />}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm font-medium text-foreground hidden sm:block">
          {user.name || user.email.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 z-50 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl p-2">
            <div className="px-3 py-2 border-b border-border/20 mb-2">
              <p className="text-sm font-medium text-foreground">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

const NavItem: React.FC<NavItemProps> = ({ 
  href, 
  label, 
  pathname, 
  onCloseMobile,
  isComingSoon = false
}) => {
  if (isComingSoon) {
    return (
      <div className="relative group">
        <button
          className="text-sm px-4 py-2 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground cursor-not-allowed relative flex items-center justify-center gap-2 hover:bg-secondary/30"
          disabled
        >
          <span className="font-medium">{label}</span>
        </button>
        
        {/* Tooltip */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-3 px-3 py-2 bg-yellow-500 text-yellow-50 text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out scale-90 group-hover:scale-100 pointer-events-none z-50 shadow-lg">
          Coming Soon
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-yellow-500 rotate-45" />
        </div>
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onCloseMobile}
      className={cx(
        'text-sm px-4 py-2 rounded-lg transition-all duration-300 relative flex items-center justify-center font-medium',
        pathname === href 
          ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' 
          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
      )}
    >
      {label}
    </Link>
  );
};

export const Header: React.FC = () => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const { user, loading, logout } = useAuth();

  const toggleMobile = () => setMobileOpen(!mobileOpen);
  const openLoginModal = () => setLoginModalOpen(true);
  const closeLoginModal = () => setLoginModalOpen(false);

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/20 bg-background/85 shadow-sm">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Left */}
            <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
              <div className="h-8 w-8 rounded-xl border border-primary/25 bg-primary/8 backdrop-blur retro-border flex items-center justify-center group-hover:scale-105 transition-all duration-300 shadow-sm">
                <div className="h-3.5 w-3.5 rounded-md bg-gradient-to-br from-primary to-accent" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-foreground group-hover:text-primary transition-colors duration-300">Postly</span>
            </Link>

            {/* Desktop Navigation - Perfectly Centered */}
            <nav className="hidden md:flex items-center justify-center absolute left-1/2 transform -translate-x-1/2">
                <NavItem 
                  href="/" 
                  label="Home" 
                  pathname={pathname}
                />
                <NavItem 
                  href="/explore" 
                  label="Explore" 
                  pathname={pathname}
                />
                <NavItem 
                  href="/upload" 
                  label="Upload" 
                  pathname={pathname}
                  isComingSoon={true}
                />
                <NavItem 
                  href="/recruiters" 
                  label="Recruiters" 
                  pathname={pathname}
                  isComingSoon={true}
                />
            </nav>

            {/* Desktop CTA - Right */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <ThemeToggle />
              {loading ? (
                <div className="w-10 h-10 rounded-xl border border-border/25 bg-background/60 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : user ? (
                <UserDropdown />
              ) : (
                <button
                  onClick={openLoginModal}
                  className="retro-button retro-border inline-flex items-center gap-2 h-10 px-5 text-sm font-medium cursor-pointer text-primary hover:text-primary-foreground transition-all duration-300 group shadow-sm"
                >
                  Get Started 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                </button>
              )}
            </div>

            {/* Mobile Menu Button - Right */}
            <div className="md:hidden flex items-center gap-3 flex-shrink-0">
              <ThemeToggle />
              <button
                className="p-2 rounded-xl border border-border/30 bg-background/60 hover:bg-secondary/50 hover:border-border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/30 backdrop-blur-sm flex items-center justify-center shadow-sm"
                onClick={toggleMobile}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <Menu className={`absolute transition-all duration-300 ${mobileOpen ? 'opacity-0 rotate-90 scale-75' : 'opacity-100 rotate-0 scale-100'}`} />
                  <X className={`absolute transition-all duration-300 ${mobileOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}`} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border/20 bg-background/95 backdrop-blur-xl animate-slide-down">
            <div className="px-6 py-4 space-y-2">
              <NavItem 
                href="/" 
                label="Home" 
                pathname={pathname}
                onCloseMobile={toggleMobile}
              />
              <NavItem 
                href="/explore" 
                label="Explore" 
                pathname={pathname}
                onCloseMobile={toggleMobile}
              />
              <NavItem 
                href="/upload" 
                label="Upload" 
                pathname={pathname}
                onCloseMobile={toggleMobile}
                isComingSoon={true}
              />
              <NavItem 
                href="/recruiters" 
                label="Recruiters" 
                pathname={pathname}
                onCloseMobile={toggleMobile}
                isComingSoon={true}
              />
              
              {/* Mobile CTA */}
              <div className="pt-4 mt-4 border-t border-border/20">
                {loading ? (
                  <div className="w-full h-12 rounded-xl border border-border/25 bg-background/60 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-background/60 border border-border/25">
                      <Avatar className="w-8 h-8 border border-primary/20">
                        <AvatarImage src={user.avatar || undefined} alt={user.name || "User"} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                          {user.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        toggleMobile();
                      }}
                      className="w-full flex items-center justify-center gap-2 h-12 px-4 text-sm font-medium text-muted-foreground hover:text-foreground border border-border/25 bg-background/60 hover:bg-secondary/50 rounded-xl transition-all duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      toggleMobile();
                      openLoginModal();
                    }}
                    className="retro-button retro-border w-full inline-flex items-center justify-center gap-2 h-12 text-sm font-medium text-primary hover:text-primary-foreground transition-all duration-300 group shadow-sm"
                  >
                    Get Started 
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Login Modal */}
      <LoginModal isOpen={loginModalOpen} onClose={closeLoginModal} />
    </>
  );
};
