import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HamburgerMenu } from './ui/HamburgerMenu';
import { useIsMobile } from '../hooks/useMediaQuery';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'glass shadow-glass' : 'bg-white shadow-sm border-b border-gray-200'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="text-2xl font-bold gradient-text hover:scale-105 transition-transform"
              aria-label="Postly Home"
            >
              Postly
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative text-gray-700 hover:text-primary-600 transition-colors font-medium ${
                    isActiveLink(link.to) ? 'text-primary-600' : ''
                  }`}
                  aria-current={isActiveLink(link.to) ? 'page' : undefined}
                >
                  {link.label}
                  {isActiveLink(link.to) && (
                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-primary rounded-full"></span>
                  )}
                </Link>
              ))}
              <Link
                to="/register"
                className="px-5 py-2.5 bg-gradient-primary text-white rounded-lg hover:shadow-glow hover:scale-105 transition-all duration-200 font-semibold"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Hamburger Menu */}
            <div className="md:hidden">
              <HamburgerMenu
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Mobile Menu */}
          <div
            className="fixed top-16 right-0 bottom-0 w-full max-w-sm glass-card z-40 p-6 animate-slide-in-right md:hidden"
            role="dialog"
            aria-label="Mobile navigation"
          >
            <nav className="flex flex-col gap-4" role="navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-3 rounded-lg text-lg font-medium transition-all ${
                    isActiveLink(link.to)
                      ? 'bg-gradient-primary text-white shadow-glow'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                  }`}
                  aria-current={isActiveLink(link.to) ? 'page' : undefined}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/register"
                className="mt-4 px-4 py-3 bg-gradient-primary text-white rounded-lg hover:shadow-glow hover:scale-105 transition-all duration-200 font-semibold text-center text-lg"
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
