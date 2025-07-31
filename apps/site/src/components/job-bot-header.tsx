"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Menu, X, Wifi } from "lucide-react";

export function JobBotHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [titleText, setTitleText] = useState("");
  const fullTitle = "JOBBOT";

  // Typewriter effect with better timing
  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index <= fullTitle.length) {
        setTitleText(fullTitle.slice(0, index));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 120);
    return () => clearInterval(timer);
  }, []);

  // Enhanced scroll detection with throttling
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
    setIsMenuOpen(false);
  };

  const navItems = [
    { label: "Features", id: "features" },
    { label: "Pricing", id: "pricing" },
    { label: "Terminal", id: "terminal" },
    { label: "Setup", id: "discord-setup" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out ${
        isScrolled
          ? "bg-slate-950/90 backdrop-blur-xl border-b border-cyan-400/10 shadow-2xl shadow-cyan-400/5"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-6 py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Logo with enhanced design */}
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="relative">
              <div className="w-10 lg:w-12 h-10 lg:h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-xl border border-cyan-300/30 group-hover:shadow-cyan-400/40 transition-all duration-500 group-hover:scale-105">
                <Bot className="w-5 lg:w-6 h-5 lg:h-6 text-slate-900" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-950">
                <div className="w-full h-full bg-green-400 rounded-full animate-ping" />
              </div>
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent font-mono tracking-wider">
                {titleText}
                <span className="animate-pulse text-cyan-300 ml-0.5">_</span>
              </h1>
              <div className="text-xs text-cyan-300/60 font-mono flex items-center space-x-1.5 -mt-0.5">
                <Wifi className="w-2.5 h-2.5 animate-pulse" />
                <span>ONLINE</span>
              </div>
            </div>
          </div>

          {/* Enhanced Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item, index) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="relative text-slate-300 hover:text-cyan-400 transition-all duration-300 font-medium text-sm group py-2.5 px-4 rounded-lg hover:bg-cyan-400/5"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="relative z-10">{item.label}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 scale-95 group-hover:scale-100" />
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-cyan-400 to-blue-400 group-hover:w-8 transition-all duration-300 transform -translate-x-1/2" />
              </button>
            ))}
          </nav>

          {/* Enhanced CTA Button */}
          <div className="hidden lg:block">
            <Button
              onClick={() => scrollToSection("signup")}
              className="relative bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-900 font-semibold px-6 py-2.5 border border-cyan-400/50 shadow-lg hover:shadow-cyan-400/30 transition-all duration-300 group overflow-hidden rounded-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Bot className="w-4 h-4 mr-2 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Get Started</span>
            </Button>
          </div>

          {/* Enhanced Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-cyan-400 hover:text-cyan-300 transition-all duration-300 p-2 rounded-lg hover:bg-cyan-400/10 active:scale-95"
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <Menu className={`w-6 h-6 absolute transition-all duration-300 ${isMenuOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}`} />
              <X className={`w-6 h-6 absolute transition-all duration-300 ${isMenuOpen ? 'rotate-0 opacity-100' : '-rotate-180 opacity-0'}`} />
            </div>
          </button>
        </div>

        {/* Enhanced Mobile Menu */}
        <div className={`lg:hidden overflow-hidden transition-all duration-500 ease-out ${
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="pt-6 mt-6 border-t border-cyan-400/20">
            <nav className="flex flex-col space-y-1">
              {navItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-slate-300 hover:text-cyan-400 hover:bg-cyan-400/5 transition-all duration-300 font-medium text-sm py-3 px-4 text-left rounded-lg group"
                  style={{ 
                    animationDelay: `${index * 50}ms`,
                    transform: isMenuOpen ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `all 300ms ease-out ${index * 50}ms`
                  }}
                >
                  <span className="group-hover:translate-x-1 transition-transform duration-300 inline-block">
                    {item.label}
                  </span>
                </button>
              ))}
              <div className="pt-4">
                <Button
                  onClick={() => scrollToSection("signup")}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-900 font-semibold px-6 py-3 border border-cyan-400/50 shadow-lg"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
