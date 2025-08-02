"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Terminal,
  Cpu,
  Wifi,
  Database,
  Users,
  MessageCircle,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { BetaSignupModal } from "@/components/beta-signup-modal";

const FEATURES = [
  {
    icon: "Upload",
    title: "AI RESUME ANALYSIS",
    description:
      "Upload your resume and let our AI match you with the perfect job opportunities based on your skills and experience.",
    features: ["Resume parsing", "Skill extraction", "Personalized matches"],
    isInteractive: true,
  },
  {
    icon: "FileText",
    title: "JOB LISTING & SOCIAL",
    description:
      "List your jobs and get automatic tweets from our social handles to reach millions of potential candidates.",
    features: ["Auto-posting", "Social reach", "Tweet integration"],
    isInteractive: true,
  },
  {
    icon: "Bot",
    title: "AI BOT INTEGRATION",
    description:
      "Discord bot with intelligent job matching and automated posting to your server channels.",
    features: ["Smart filtering", "Real-time updates", "Custom commands"],
    isInteractive: false,
  },
  {
    icon: "Database",
    title: "MILLIONS OF JOBS",
    description:
      "Access to over 2.8M+ job listings from major platforms, updated in real-time.",
    features: [
      "LinkedIn integration",
      "Indeed scraping",
      "Remote opportunities",
    ],
    isInteractive: false,
  },
  {
    icon: "Trash2",
    title: "AUTO CLEANUP",
    description:
      "Intelligent deletion system that removes expired and filled positions automatically.",
    features: ["Expired job removal", "Duplicate detection", "Clean channels"],
    isInteractive: false,
  },
];

export default function HomePage() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Icon mapping
  const iconMap = {
    Bot,
    Database,
    Users,
  } as const;

  // Ensure client-side only rendering for dynamic content
  useEffect(() => {
    setMounted(true);
  }, []);

  const phases = useMemo(
    () => [
      "SCANNING JOB BOARDS...",
      "FILTERING OPPORTUNITIES...",
      "MATCHING CANDIDATES...",
      "POSTING TO DISCORD...",
      "CLEANING OLD LISTINGS...",
      "OPTIMIZING RESULTS...",
    ],
    [],
  );

  // Glitch effect (client-side only)
  useEffect(() => {
    if (!mounted) return;

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + Math.random() * 0.3;
        if (newProgress >= 100) {
          setCurrentPhase((p) => (p + 1) % phases.length);
          return 0;
        }
        return newProgress;
      });
    }, 80);

    return () => clearInterval(progressInterval);
  }, [phases.length, mounted]);

  const handleBetaAccess = () => {
    setShowBetaModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-transparent to-teal-500/20" />
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="container mx-auto text-center">
          {/* Status Bar */}
          <div className="mb-8 flex items-center justify-center space-x-6 text-sm font-mono">
            <div className="flex items-center space-x-2">
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">SYSTEM ONLINE</span>
            </div>
            <div className="w-1 h-4 bg-slate-600" />
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">2,847,392 JOBS</span>
            </div>
            <div className="w-1 h-4 bg-slate-600" />
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">50K+ USERS</span>
            </div>
          </div>

          {/* Main Heading */}
          <div className="mb-8">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-mono tracking-wider mb-6 text-emerald-400">
              HIRING MADE SIMPLE
            </h1>
            <p className="text-xl md:text-2xl text-slate-400 font-mono max-w-4xl mx-auto leading-relaxed">
              Automated job discovery for Discord communities.{" "}
              <span className="text-emerald-400">Smart AI matching</span>,
              instant posting, seamless applications. Built for the modern job
              seeker.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={handleBetaAccess}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-8 py-4 border border-emerald-400 shadow-lg transition-all duration-200 hover:shadow-emerald-400/20 rounded-lg flex items-center justify-center space-x-3"
            >
              <Bot className="w-5 h-5" />
              <span>JOIN BETA ACCESS</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={handleBetaAccess}
              className="bg-transparent border-2 border-emerald-400/50 text-emerald-400 hover:bg-emerald-400/10 font-mono font-bold px-8 py-4 transition-all duration-200 rounded-lg flex items-center justify-center space-x-3"
            >
              <MessageCircle className="w-5 h-5" />
              <span>ADD TO DISCORD</span>
            </button>
          </div>

          {/* Live Processing Display */}
          <div className="max-w-2xl mx-auto mb-20">
            <div className="bg-slate-900/80 border border-emerald-400/30 rounded-lg p-6 font-mono backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-emerald-400 text-sm flex items-center space-x-2">
                  <Terminal className="w-4 h-4" />
                  <span>PROCESSING...</span>
                </span>
                <span className="text-emerald-400 text-sm">
                  {Math.round(loadingProgress)}%
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-300 relative"
                  style={{ width: `${loadingProgress}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>
              </div>

              <div className="text-slate-400 text-sm leading-relaxed h-5 overflow-hidden">
                <div
                  className="transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateY(-${currentPhase * 20}px)` }}
                >
                  {phases.map((phase, index) => (
                    <div key={index} className="h-5 flex items-center">
                      <Cpu className="w-3 h-3 mr-2 animate-spin" />
                      {phase}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6 border-t border-emerald-400/20">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-emerald-400 font-mono mb-6">
              [CORE_FEATURES]
            </h2>
            <p className="text-xl text-slate-400 font-mono max-w-3xl mx-auto">
              Powered by advanced AI algorithms and millions of job listings
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={`bg-slate-900/50 border border-emerald-400/20 rounded-lg p-8 shadow-lg backdrop-blur-sm group ${
                  feature.isInteractive
                    ? "hover:border-emerald-400/50 hover:shadow-emerald-400/10 cursor-pointer transition-all duration-300"
                    : ""
                }`}
                onClick={feature.isInteractive ? handleBetaAccess : undefined}
              >
                <div className="flex items-center mb-6">
                  <div
                    className={`w-12 h-12 border border-emerald-400/30 rounded-lg flex items-center justify-center mr-4 transition-colors ${
                      feature.isInteractive
                        ? "bg-emerald-400/20 group-hover:bg-emerald-400/30"
                        : "bg-emerald-400/10 group-hover:bg-emerald-400/20"
                    }`}
                  >
                    {(() => {
                      const IconComponent =
                        iconMap[feature.icon as keyof typeof iconMap];
                      // Ensure IconComponent exists before rendering
                      if (!IconComponent) {
                        console.warn(
                          `Icon "${feature.icon}" not found in iconMap`,
                        );
                        return (
                          <div className="w-6 h-6 bg-emerald-400/20 rounded" />
                        );
                      }
                      return (
                        <IconComponent className="w-6 h-6 text-emerald-400" />
                      );
                    })()}
                  </div>
                  <h3 className="text-emerald-400 font-mono font-bold text-lg">
                    {feature.title}
                  </h3>
                  {feature.isInteractive && (
                    <ArrowRight className="w-4 h-4 text-emerald-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <p className="text-slate-400 font-mono text-sm mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center text-slate-500 font-mono text-xs"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-400 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
                {feature.isInteractive && (
                  <div className="mt-4 text-emerald-400 font-mono text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to try in beta →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-20 px-6 bg-slate-900/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-emerald-400 font-mono mb-6">
              [HOW_IT_WORKS]
            </h2>
            <p className="text-xl text-slate-400 font-mono max-w-3xl mx-auto">
              Get started in 3 simple steps
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-400/20 border border-emerald-400/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-400 font-mono text-2xl font-bold">1</span>
                </div>
                <h3 className="text-emerald-400 font-mono font-bold text-xl mb-3">ADD BOT</h3>
                <p className="text-slate-400 font-mono text-sm">
                  Invite our Discord bot to your server with one click
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-400/20 border border-emerald-400/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-400 font-mono text-2xl font-bold">2</span>
                </div>
                <h3 className="text-emerald-400 font-mono font-bold text-xl mb-3">SET FILTERS</h3>
                <p className="text-slate-400 font-mono text-sm">
                  Configure job preferences and skills you&apos;re looking for
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-400/20 border border-emerald-400/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-emerald-400 font-mono text-2xl font-bold">3</span>
                </div>
                <h3 className="text-emerald-400 font-mono font-bold text-xl mb-3">GET JOBS</h3>
                <p className="text-slate-400 font-mono text-sm">
                  Receive instant job matches posted directly to your Discord
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-6 border-t border-emerald-400/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-emerald-400 font-mono mb-6">
            GET STARTED
          </h2>
          <p className="text-xl text-slate-400 font-mono mb-12 max-w-2xl mx-auto">
            Join the Discord job revolution today
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={handleBetaAccess}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-12 py-6 border border-emerald-400 shadow-lg transition-all duration-200 hover:shadow-emerald-400/20 rounded-lg text-lg flex items-center justify-center space-x-3"
            >
              <Bot className="w-6 h-6" />
              <span>START NOW</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Beta Signup Modal */}
      <BetaSignupModal
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />
    </div>
  );
}
