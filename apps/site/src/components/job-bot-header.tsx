"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Menu, X, Wifi, Lock } from "lucide-react";
import { BetaSignupModal } from "./beta-signup-modal";

export function JobBotHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showBetaModal, setShowBetaModal] = useState(false);

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = () => {
    // Prevent navigation - show beta modal instead
    setShowBetaModal(true);
    setIsMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-slate-950/95 backdrop-blur-md border-b border-emerald-400/20 shadow-lg shadow-emerald-400/5"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center shadow-lg border border-emerald-300/50">
              <Bot className="w-6 h-6 text-slate-900" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-emerald-400 font-mono tracking-wider">
                POSTLY
              </h1>
              <div className="text-xs text-emerald-300/70 font-mono flex items-center space-x-2">
                <Wifi className="w-3 h-3" />
                <span>ONLINE</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {[
              { label: "FEATURES", id: "features" },
              { label: "PRICING", id: "pricing" },
              { label: "TERMINAL", id: "terminal" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={scrollToSection}
                className="text-slate-300 hover:text-emerald-400 transition-colors duration-200 font-mono text-sm tracking-wide py-2 px-3 relative group"
              >
                <span className="flex items-center space-x-2">
                  <span>[{item.label}]</span>
                  <Lock className="w-3 h-3 opacity-50" />
                </span>
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-emerald-400 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono whitespace-nowrap">
                  BETA ACCESS REQUIRED
                </div>
              </button>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:block">
            <Button
              onClick={scrollToSection}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-6 py-3 border border-emerald-400 shadow-lg transition-colors duration-200"
            >
              <Bot className="w-4 h-4 mr-2" />
              JOIN BETA ACCESS
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden text-emerald-400 hover:text-emerald-300 transition-colors duration-200 p-2 rounded-lg"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-6 pt-6 border-t border-emerald-400/30">
            <nav className="flex flex-col space-y-4">
              {[
                { label: "FEATURES", id: "features" },
                { label: "PRICING", id: "pricing" },
                { label: "TERMINAL", id: "terminal" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={scrollToSection}
                  className="text-slate-300 hover:text-emerald-400 transition-colors duration-200 font-mono text-sm tracking-wide py-2 text-left flex items-center justify-between"
                >
                  <span>[{item.label}]</span>
                  <Lock className="w-3 h-3 opacity-50" />
                </button>
              ))}
              <Button
                onClick={scrollToSection}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-6 py-3 border border-emerald-400 shadow-lg mt-4 transition-colors duration-200"
              >
                <Bot className="w-4 h-4 mr-2" />
                JOIN BETA ACCESS
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* Beta Signup Modal */}
      <BetaSignupModal
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />
    </header>
  );
}
