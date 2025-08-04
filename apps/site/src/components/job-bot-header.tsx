"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bot, Menu, X, Wifi } from "lucide-react";
import { AuthButton } from "./auth-button";
import { useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

export function JobBotHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      // Scroll to features section or just navigate to dashboard
      router.push("/dashboard");
    }
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
            <div className="text-center">
              <h1 className="text-2xl font-bold text-emerald-400 font-mono tracking-wider">
                JOBBOT
              </h1>
              <div className="text-xs text-emerald-300/70 font-mono flex items-center justify-center space-x-2">
                <Wifi className="w-3 h-3" />
                <span>ONLINE</span>
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center justify-center space-x-8 flex-1">
            {[
              { label: "FEATURES", id: "features" },
              { label: "DASHBOARD", id: "dashboard" },
              { label: "JOBS", id: "jobs" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={handleGetStarted}
                className="text-slate-300 hover:text-emerald-400 transition-colors duration-200 font-mono text-sm tracking-wide py-2 px-3 relative group"
              >
                <span className="flex items-center space-x-2">
                  <span>[{item.label}]</span>
                </span>
              </button>
            ))}
          </nav>

          {/* Auth Button & CTA Button */}
          <div className="hidden lg:flex items-center gap-4">
            <AuthButton />
            <Button
              onClick={handleGetStarted}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-6 py-3 border border-emerald-400 shadow-lg transition-colors duration-200"
            >
              <Bot className="w-4 h-4 mr-2" />
              {user ? "DASHBOARD" : "GET STARTED"}
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
                { label: "DASHBOARD", id: "dashboard" },
                { label: "JOBS", id: "jobs" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={handleGetStarted}
                  className="text-slate-300 hover:text-emerald-400 transition-colors duration-200 font-mono text-sm tracking-wide py-2 text-left flex items-center justify-between"
                >
                  <span>[{item.label}]</span>
                </button>
              ))}
              <div className="pt-4">
                <AuthButton />
              </div>
              <Button
                onClick={handleGetStarted}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-6 py-3 border border-emerald-400 shadow-lg transition-colors duration-200"
              >
                <Bot className="w-4 h-4 mr-2" />
                {user ? "DASHBOARD" : "GET STARTED"}
              </Button>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
