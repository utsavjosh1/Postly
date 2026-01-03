import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useIsMobile } from '../hooks/useMediaQuery';
import { ThemeToggle } from './ui/ThemeToggle';

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navLinks = [
    { to: '/chat', label: 'AI Chat' },
    { to: '/login', label: 'Login' },
  ];

  const isActiveLink = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-semibold text-foreground" aria-label="Postly Home">
              Postly
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActiveLink(link.to)
                      ? 'text-foreground bg-muted'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  aria-current={isActiveLink(link.to) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}

              <div className="mx-2 h-5 w-px bg-border" />

              <ThemeToggle />

              <Link
                to="/register"
                className="ml-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-all"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile: Theme Toggle + Hamburger */}
            <div className="md:hidden flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isMobileMenuOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" aria-hidden="true"></div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Menu */}
          <div
            className="fixed top-16 right-0 bottom-0 w-full max-w-xs bg-background border-l border-border z-40 p-6 md:hidden"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <nav className="flex flex-col gap-2" role="navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActiveLink(link.to)
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                  aria-current={isActiveLink(link.to) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/register"
                className="mt-4 px-4 py-3 bg-foreground text-background rounded-lg font-medium text-center hover:opacity-90 transition-all"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
