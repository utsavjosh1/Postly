"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Bot,
  Terminal,
  Cpu,
  Wifi,
  Database,
  Users,
  Trash2,
  MessageCircle,
  Search,
  Bell,
  ArrowRight,
  Star,
  CheckCircle,
  TrendingUp,
  Shield,
  Clock,
  Upload,
  FileText,
  Twitter,
  Linkedin,
} from "lucide-react";
import { BetaSignupModal } from "@/components/beta-signup-modal";

export default function HomePage() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [mounted, setMounted] = useState(false);

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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[
              {
                icon: Upload,
                title: "AI RESUME ANALYSIS",
                description:
                  "Upload your resume and let our AI match you with the perfect job opportunities based on your skills and experience.",
                features: [
                  "Resume parsing",
                  "Skill extraction",
                  "Personalized matches",
                ],
                isInteractive: true,
              },
              {
                icon: FileText,
                title: "JOB LISTING & SOCIAL",
                description:
                  "List your jobs and get automatic tweets from our social handles to reach millions of potential candidates.",
                features: ["Auto-posting", "Social reach", "Tweet integration"],
                isInteractive: true,
              },
              {
                icon: Bot,
                title: "AI BOT INTEGRATION",
                description:
                  "Discord bot with intelligent job matching and automated posting to your server channels.",
                features: [
                  "Smart filtering",
                  "Real-time updates",
                  "Custom commands",
                ],
                isInteractive: false,
              },
              {
                icon: Database,
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
                icon: Trash2,
                title: "AUTO CLEANUP",
                description:
                  "Intelligent deletion system that removes expired and filled positions automatically.",
                features: [
                  "Expired job removal",
                  "Duplicate detection",
                  "Clean channels",
                ],
                isInteractive: false,
              },
              {
                icon: Search,
                title: "SMART SEARCH",
                description:
                  "Advanced filtering by location, salary, experience level, and custom criteria.",
                features: [
                  "Location-based",
                  "Salary ranges",
                  "Experience levels",
                ],
                isInteractive: false,
              },
              {
                icon: Bell,
                title: "INSTANT ALERTS",
                description:
                  "Real-time notifications for new opportunities matching your preferences.",
                features: [
                  "Discord pings",
                  "Email alerts",
                  "Mobile notifications",
                ],
                isInteractive: false,
              },
              {
                icon: Shield,
                title: "VERIFIED LISTINGS",
                description:
                  "All job postings are verified and filtered to ensure legitimacy and quality.",
                features: [
                  "Spam protection",
                  "Quality control",
                  "Trusted sources",
                ],
                isInteractive: false,
              },
            ].map((feature) => (
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
                    <feature.icon className="w-6 h-6 text-emerald-400" />
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

      {/* AI Resume Analysis Section */}
      <section className="relative z-10 py-20 px-6 bg-slate-900/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-emerald-400 font-mono mb-6">
              [AI_RESUME_MATCHER]
            </h2>
            <p className="text-xl text-slate-400 font-mono max-w-3xl mx-auto">
              Upload your resume and get AI-powered job recommendations tailored
              to your skills
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-emerald-400/30 rounded-lg p-8 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-emerald-400 font-mono font-bold text-xl mb-4">
                    HOW IT WORKS
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-emerald-400/20 border border-emerald-400/30 rounded flex items-center justify-center mt-1">
                        <span className="text-emerald-400 font-mono text-sm">
                          1
                        </span>
                      </div>
                      <div>
                        <h4 className="text-slate-300 font-mono font-bold mb-1">
                          Upload Resume
                        </h4>
                        <p className="text-slate-400 font-mono text-sm">
                          Upload your PDF or DOCX resume securely
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-emerald-400/20 border border-emerald-400/30 rounded flex items-center justify-center mt-1">
                        <span className="text-emerald-400 font-mono text-sm">
                          2
                        </span>
                      </div>
                      <div>
                        <h4 className="text-slate-300 font-mono font-bold mb-1">
                          AI Analysis
                        </h4>
                        <p className="text-slate-400 font-mono text-sm">
                          Our AI extracts skills, experience, and preferences
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-emerald-400/20 border border-emerald-400/30 rounded flex items-center justify-center mt-1">
                        <span className="text-emerald-400 font-mono text-sm">
                          3
                        </span>
                      </div>
                      <div>
                        <h4 className="text-slate-300 font-mono font-bold mb-1">
                          Perfect Matches
                        </h4>
                        <p className="text-slate-400 font-mono text-sm">
                          Get curated job recommendations from 2.8M+ listings
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div
                    className="border-2 border-dashed border-emerald-400/30 rounded-lg p-8 text-center hover:border-emerald-400/50 transition-colors cursor-pointer"
                    onClick={handleBetaAccess}
                  >
                    <Upload className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
                    <h4 className="text-emerald-400 font-mono font-bold mb-2">
                      DRAG & DROP RESUME
                    </h4>
                    <p className="text-slate-400 font-mono text-sm mb-4">
                      Supports PDF, DOCX formats
                    </p>
                    <button
                      onClick={handleBetaAccess}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-6 py-3 rounded transition-colors"
                    >
                      TRY AI MATCHING
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Media Integration Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-emerald-400 font-mono mb-6">
              [SOCIAL_REACH]
            </h2>
            <p className="text-xl text-slate-400 font-mono max-w-3xl mx-auto">
              List your jobs and get automatic promotion across our social media
              channels
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-emerald-400/30 rounded-lg p-8 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-emerald-400 font-mono font-bold text-xl mb-6">
                    AUTOMATIC PROMOTION
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-lg">
                      <Twitter className="w-8 h-8 text-blue-400" />
                      <div>
                        <h4 className="text-slate-300 font-mono font-bold">
                          Twitter/X
                        </h4>
                        <p className="text-slate-400 font-mono text-sm">
                          50K+ followers
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-lg">
                      <Linkedin className="w-8 h-8 text-blue-600" />
                      <div>
                        <h4 className="text-slate-300 font-mono font-bold">
                          LinkedIn
                        </h4>
                        <p className="text-slate-400 font-mono text-sm">
                          25K+ connections
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="bg-slate-800/50 border border-emerald-400/30 rounded-lg p-6">
                    <h4 className="text-emerald-400 font-mono font-bold mb-4">
                      SAMPLE TWEET
                    </h4>
                    <div className="bg-slate-900 p-4 rounded border-l-4 border-emerald-400">
                      <p className="text-slate-300 font-mono text-sm mb-3">
                        🚀 NEW JOB ALERT!
                        <br />
                        Senior Frontend Developer at TechCorp
                        <br />
                        💰 $120k-$150k • 📍 Remote
                        <br />
                        #React #TypeScript #RemoteWork
                      </p>
                      <div className="flex items-center space-x-4 text-slate-500 font-mono text-xs">
                        <span>🔄 125 Retweets</span>
                        <span>❤️ 89 Likes</span>
                      </div>
                    </div>
                    <button
                      onClick={handleBetaAccess}
                      className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-6 py-3 rounded transition-colors"
                    >
                      LIST YOUR JOB
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-10 py-20 px-6 bg-slate-900/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-emerald-400 font-mono mb-6">
              [SYSTEM_METRICS]
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                icon: Database,
                value: "2.8M+",
                label: "ACTIVE JOBS",
                description: "Updated every minute",
              },
              {
                icon: Users,
                value: "50K+",
                label: "DISCORD USERS",
                description: "Across 500+ servers",
              },
              {
                icon: TrendingUp,
                value: "95%",
                label: "MATCH ACCURACY",
                description: "AI-powered precision",
              },
              {
                icon: Clock,
                value: "< 30s",
                label: "RESPONSE TIME",
                description: "Lightning fast results",
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className="w-16 h-16 bg-emerald-400/10 border border-emerald-400/30 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-400/20 transition-colors">
                  <stat.icon className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-4xl md:text-5xl font-bold text-emerald-400 font-mono mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-bold text-slate-300 font-mono mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-slate-500 font-mono">
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Discord Integration Preview */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-emerald-400 font-mono mb-6">
              [DISCORD_INTEGRATION]
            </h2>
            <p className="text-xl text-slate-400 font-mono max-w-3xl mx-auto">
              Seamlessly integrates with your Discord server for automated job
              posting
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-900/80 border border-emerald-400/30 rounded-lg p-8 font-mono backdrop-blur-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-6 h-6 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">
                    #job-postings
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-slate-400 text-sm">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span>LIVE</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-800/50 border-l-4 border-emerald-400 p-4 rounded">
                  <div className="flex items-start space-x-3">
                    <Bot className="w-8 h-8 text-emerald-400 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-emerald-400 font-bold">
                          PostlyBot
                        </span>
                        <span className="bg-emerald-400/20 text-emerald-400 px-2 py-1 rounded text-xs">
                          BOT
                        </span>
                        <span className="text-slate-500 text-sm">just now</span>
                      </div>
                      <div className="text-slate-300 text-sm">
                        <strong>🚀 New Job Alert!</strong>
                        <br />
                        <strong>Senior Frontend Developer</strong> - TechCorp
                        Inc.
                        <br />
                        💰 $120k - $150k • 📍 Remote • ⏰ Full-time
                        <br />
                        React, TypeScript, Next.js required
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <button className="bg-emerald-500 text-slate-900 px-3 py-1 rounded text-xs font-bold">
                          APPLY NOW
                        </button>
                        <button className="bg-slate-700 text-slate-300 px-3 py-1 rounded text-xs">
                          SAVE JOB
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 px-6 border-t border-emerald-400/20">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-emerald-400 font-mono mb-6">
            READY TO REVOLUTIONIZE HIRING?
          </h2>
          <p className="text-xl text-slate-400 font-mono mb-12 max-w-3xl mx-auto">
            Join thousands of Discord communities already using POSTLY to
            streamline their job discovery process
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={handleBetaAccess}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold px-12 py-6 border border-emerald-400 shadow-lg transition-all duration-200 hover:shadow-emerald-400/20 rounded-lg text-lg flex items-center justify-center space-x-3"
            >
              <Star className="w-6 h-6" />
              <span>START BETA TRIAL</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-8 text-slate-500 font-mono text-sm">
            ✨ FREE during beta • No credit card required • Setup in under 2
            minutes
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
