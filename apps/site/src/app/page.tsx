"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Terminal,
  Cpu,
  Database,
  Users,
  MessageCircle,
  ArrowRight,
  CheckCircle,
} from "lucide-react";
import { BetaSignupModal } from "@/components/beta-signup-modal";

const FEATURES = [
  {
    icon: "Database",
    title: "2.8M+ Job Listings",
    description:
      "Real-time access to millions of opportunities from top job boards, companies, and recruiters worldwide.",
    features: ["Live data sync", "Global coverage", "Premium listings"],
    isInteractive: false,
  },
  {
    icon: "Bot",
    title: "AI-Powered Matching",
    description:
      "Advanced algorithms analyze your profile and match you with positions that fit your skills, experience, and career goals.",
    features: ["Smart recommendations", "Skill-based matching", "Career progression"],
    isInteractive: true,
  },
  {
    icon: "MessageCircle",
    title: "Smart Hiring Dashboard",
    description:
      "Post jobs, filter candidates, and get AI-matched profiles tailored to your hiring needs — all from one intuitive dashboard.",
    features: ["Candidate fit scores", "Instant filtering", "Secure contact system"],
    isInteractive: true,
  },
  {
    icon: "Users",
    title: "Trusted by 50K+ Users",
    description:
      "Join thousands of professionals who've found their dream jobs through our platform. Verified companies, real opportunities.",
    features: ["Verified employers", "Success stories", "Community support"],
    isInteractive: false,
  },
];

export default function HomePage() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  const iconMap = {
    Bot,
    Database,
    Users,
    MessageCircle,
  } as const;

  useEffect(() => {
    setMounted(true);
  }, []);

  const phases = useMemo(
    () => [
      "INDEXING NEW OPPORTUNITIES...",
      "ANALYZING JOB REQUIREMENTS...",
      "UPDATING MARKET DATA...",
      "MATCHING CANDIDATES...",
      "VERIFYING EMPLOYERS...",
      "OPTIMIZING SEARCH RESULTS...",
    ],
    []
  );

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
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-transparent to-teal-500/20" />
      </div>

      <section className="relative z-10 pt-32 pb-20 px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl text-center">
          <div className="mb-8 flex items-center justify-center space-x-6 text-xs font-mono text-slate-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>LIVE</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center space-x-2">
              <Database className="w-3 h-3" />
              <span>2,847,392 ACTIVE JOBS</span>
            </div>
            <div className="w-px h-3 bg-slate-700" />
            <div className="flex items-center space-x-2">
              <Users className="w-3 h-3" />
              <span>50K+ PROFESSIONALS</span>
            </div>
          </div>

          <div className="mb-12 space-y-6">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Smarter Hiring. Better Jobs.
              <br />
              <span className="text-emerald-400">AI-Matched in Seconds</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Whether you&apos;re hiring top talent or searching for your next big opportunity — our AI does the heavy lifting. Real-time insights, smart matchmaking, and a global network at your fingertips.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button
              onClick={handleBetaAccess}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-8 py-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <span>Find a Job</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleBetaAccess}
              className="bg-transparent border border-slate-600 text-slate-300 hover:border-emerald-400 hover:text-emerald-400 font-semibold px-8 py-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-3"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Post a Job</span>
            </button>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-400 text-sm flex items-center space-x-2">
                  <Terminal className="w-4 h-4" />
                  <span>Live Data Processing</span>
                </span>
                <span className="text-emerald-400 text-sm font-mono">
                  {Math.round(loadingProgress)}%
                </span>
              </div>

              <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>

              <div className="text-slate-500 text-sm h-5 overflow-hidden">
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

      <section className="relative z-10 py-20 px-6 lg:px-8 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Built for Job Seekers & Recruiters Alike
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              AI-powered tools that make hiring fast and job searching effortless — trusted by 50K+ professionals and employers worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className={`bg-slate-900/30 border border-slate-800 rounded-lg p-8 backdrop-blur-sm group transition-all duration-300 ${
                  feature.isInteractive
                    ? "hover:bg-slate-900/50 hover:border-emerald-400/30 cursor-pointer"
                    : "hover:bg-slate-900/40"
                }`}
                onClick={feature.isInteractive ? handleBetaAccess : undefined}
              >
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-emerald-400/10 border border-emerald-400/20 rounded-lg flex items-center justify-center mr-4 group-hover:bg-emerald-400/20 transition-colors">
                    {(() => {
                      const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
                      if (!IconComponent) {
                        return <div className="w-6 h-6 bg-emerald-400/20 rounded" />;
                      }
                      return <IconComponent className="w-6 h-6 text-emerald-400" />;
                    })()}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
                  </div>
                  {feature.isInteractive && (
                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  )}
                </div>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.features.map((item, i) => (
                    <li key={i} className="flex items-center text-slate-500 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mr-3 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-6 lg:px-8 bg-slate-900/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-emerald-400 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Create Profile</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Upload your resume and set your job preferences. Our AI analyzes your skills and experience.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-emerald-400 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Get Matched</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Receive personalized job recommendations from our database of 2.8M+ opportunities.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-emerald-400 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-white font-semibold text-xl mb-3">Apply & Connect</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Apply directly through our platform and connect with hiring managers instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 py-20 px-6 lg:px-8 border-t border-slate-800">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Ready to Match Smarter?
          </h2>
          <p className="text-lg text-slate-400 mb-8 max-w-2xl mx-auto">
            Join our growing network of professionals and recruiters — where AI meets opportunity.
          </p>
          <button
            onClick={handleBetaAccess}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-8 py-4 rounded-lg transition-all duration-200 inline-flex items-center space-x-2"
          >
            <span>Get Started Today</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <BetaSignupModal
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />
    </div>
  );
}
