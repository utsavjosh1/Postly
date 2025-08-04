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
  Upload,
  Target,
  Handshake,
  Star,
  CheckCircle,
  Sparkles,
  Heart,
  Briefcase,
  Shield,
  Zap,
  Clock,
  Award,
  X,
  Trophy,
  Mail,
  Lock,
  Crown,
  Rocket,
  FileText,
  BarChart3,
  Settings,
  Palette,
  Play,
} from "lucide-react";

// Animated Counter Component
interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

function AnimatedCounter({ end, duration = 2000, suffix = "", prefix = "" }: AnimatedCounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOutQuart * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <span className="font-bold">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
}

const PRICING_TIERS = [
  {
    id: "starter",
    title: "Job Seeker",
    subtitle: "Perfect for individuals",
    price: "Free",
    period: "forever",
    popular: false,
    icon: "Briefcase",
    features: [
      { name: "Basic resume upload", included: true },
      { name: "AI job matching", included: true },
      { name: "5 applications per day", included: true },
      { name: "Email notifications", included: true },
      { name: "Advanced analytics", included: false, locked: true },
      { name: "Priority support", included: false, locked: true },
    ],
    cta: "Start Free"
  },
  {
    id: "premium",
    title: "Discord Bot",
    subtitle: "For communities & recruiters",
    price: "₹2,999",
    period: "per month",
    popular: true,
    icon: "Crown",
    features: [
      { name: "Everything in Free", included: true },
      { name: "Custom Discord integration", included: true },
      { name: "Unlimited job postings", included: true },
      { name: "Advanced member analytics", included: true },
      { name: "Custom branding", included: true },
      { name: "24/7 priority support", included: true },
    ],
    cta: "Go Premium"
  }
];

const LOCKED_FEATURES = [
  {
    icon: "BarChart3",
    title: "Advanced Analytics",
    description: "Deep insights into your job search performance with conversion rates, application tracking, and market trends.",
    tier: "Premium"
  },
  {
    icon: "Settings",
    title: "Custom Automation",
    description: "Set up automated job alerts, application scheduling, and personalized follow-up sequences.",
    tier: "Premium"
  },
  {
    icon: "Palette",
    title: "Custom Branding",
    description: "White-label the bot with your company colors, logo, and custom messaging for your Discord server.",
    tier: "Premium"
  },
  {
    icon: "Shield",
    title: "Priority Support",
    description: "Get instant help with dedicated support, custom setup assistance, and feature requests.",
    tier: "Premium"
  }
];

// Feature Lock Modal Component
interface FeatureLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: {
    icon: string;
    title: string;
    description: string;
    tier: string;
  };
}

function FeatureLockModal({ isOpen, onClose, feature }: FeatureLockModalProps) {
  if (!isOpen || !feature) return null;

  // Local icon map for the modal
  const modalIconMap = {
    BarChart3,
    Settings,
    Palette,
    Shield,
    Crown,
    Lock,
    CheckCircle,
    Rocket,
    ArrowRight,
  } as const;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-amber-500/30 rounded-3xl p-8 max-w-lg w-full relative overflow-hidden">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400/20 to-purple-500/20 border border-amber-400/30 rounded-2xl flex items-center justify-center mx-auto mb-6 relative">
              <Lock className="w-8 h-8 text-amber-400 absolute top-2 right-2" />
              {(() => {
                const IconComponent = modalIconMap[feature.icon as keyof typeof modalIconMap];
                return IconComponent ? <IconComponent className="w-10 h-10 text-white" /> : <Shield className="w-10 h-10 text-white" />;
              })()}
            </div>
            <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-2 mb-4">
              <Crown className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 font-semibold text-sm">{feature.tier} Feature</span>
            </div>
            <h3 className="text-3xl font-bold text-white mb-3">{feature.title}</h3>
            <p className="text-slate-300 text-lg leading-relaxed">{feature.description}</p>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-slate-300">Unlock advanced capabilities</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Rocket className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-slate-300">Priority support & updates</span>
            </div>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-slate-300">Custom configuration options</span>
            </div>
          </div>

          {/* CTA */}
          <div className="space-y-4">
            <button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 font-bold py-4 px-6 rounded-2xl transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-amber-500/25 transform hover:-translate-y-0.5">
              <Crown className="w-5 h-5" />
              <span>Upgrade to Premium</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="w-full text-slate-400 hover:text-white font-medium py-3 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
interface BetaSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function BetaSignupModal({ isOpen, onClose }: BetaSignupModalProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("jobseeker");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-400/10 border border-emerald-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Rishta Confirmed! 💚
            </h3>
            <p className="text-slate-300 mb-6">
              Welcome to the family! You&apos;ll hear from us soon with your perfect
              job matches.
            </p>
            <button
              onClick={onClose}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold px-6 py-3 rounded-xl transition-colors w-full"
            >
              Shabash! Close
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">
                Join the Beta
              </h3>
              <p className="text-slate-400">
                Be among the first to find your perfect job rishta
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "jobseeker", label: "Job Seeker" },
                    { value: "recruiter", label: "Recruiter" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`p-3 rounded-lg border transition-all ${
                        role === option.value
                          ? "border-emerald-400 bg-emerald-400/10 text-emerald-400"
                          : "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-emerald-600 disabled:cursor-not-allowed text-slate-900 font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Cpu className="w-4 h-4 animate-spin" />
                    <span>Processing Biodata...</span>
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4" />
                    <span>Find My Rishta</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showBetaModal, setShowBetaModal] = useState(false);
  const [showFeatureLock, setShowFeatureLock] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<typeof LOCKED_FEATURES[0] | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  const iconMap = {
    Bot,
    Database,
    Users,
    MessageCircle,
    Upload,
    Target,
    Handshake,
    Shield,
    Zap,
    Award,
    Clock,
    Star,
    CheckCircle,
    Sparkles,
    Heart,
    Briefcase,
    Trophy,
    Mail,
    Lock,
    Crown,
    Rocket,
    FileText,
    BarChart3,
    Settings,
    Palette,
    Play,
  } as const;

  useEffect(() => {
    setMounted(true);
  }, []);

  const phases = useMemo(
    () => [
      "SCANNING BIODATA FOR COMPATIBILITY...",
      "CHECKING EMPLOYER FAMILY BACKGROUND...",
      "MATCHING SALARY EXPECTATIONS...",
      "VERIFYING CULTURAL FIT PARAMETERS...",
      "CONFIRMING LONG-TERM CAREER GOALS...",
      "FINALIZING SUITABLE JOB RISHTAS...",
    ],
    []
  );

  useEffect(() => {
    if (!mounted) return;

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        const newProgress = prev + Math.random() * 0.4;
        if (newProgress >= 100) {
          setCurrentPhase((p) => (p + 1) % phases.length);
          return 0;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, [phases.length, mounted]);

  // Auto-rotate testimonials - removed
  useEffect(() => {
    // Cleanup empty effect
  }, []);

  const handleBetaAccess = () => {
    setShowBetaModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Retro Grid Background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.3)_1px,transparent_1px)] bg-[size:60px_60px] animate-grid-move"></div>
      </div>

      {/* Scanlines Effect */}
      <div className="absolute inset-0 terminal-scanlines pointer-events-none opacity-30"></div>

      {/* Floating Terminal Windows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-20 retro-terminal rounded-lg animate-float opacity-40">
          <div className="p-2 text-emerald-400 font-mono text-xs">
            <div className="flex items-center space-x-1 mb-1">
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
            </div>
            <div>$ jobs --scan</div>
            <div className="animate-pulse">█</div>
          </div>
        </div>
        <div className="absolute top-40 right-20 w-28 h-16 retro-terminal rounded-lg animate-float-delayed opacity-30">
          <div className="p-2 text-emerald-400 font-mono text-xs">
            <div>MATCH: 98%</div>
            <div className="text-emerald-300">CONFIRMED</div>
          </div>
        </div>
        <div className="absolute bottom-40 left-20 w-36 h-24 retro-terminal rounded-lg animate-float-slow opacity-35">
          <div className="p-2 text-emerald-400 font-mono text-xs">
            <div>RESUME.PDF</div>
            <div className="text-emerald-300">PROCESSING...</div>
            <div className="mt-1 h-1 bg-slate-800 rounded">
              <div className="h-1 bg-emerald-400 rounded animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-20 px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl text-center">
          {/* Terminal Status Bar */}
          <div className="mb-12 inline-flex items-center space-x-3 retro-border rounded-lg px-6 py-3 bg-slate-950/80 backdrop-blur-xl font-mono text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 font-bold tracking-wider">[SYSTEM ONLINE]</span>
            </div>
            <div className="w-px h-4 bg-emerald-400/30"></div>
            <span className="text-slate-300">2.8M+ RECORDS</span>
            <div className="w-px h-4 bg-emerald-400/30"></div>
            <span className="text-slate-300">50K+ MATCHED</span>
          </div>

          {/* Main Terminal Header */}
          <div className="mb-16">
            <div className="retro-terminal rounded-3xl p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-4 left-4 flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-black text-white leading-none mb-6 tracking-tight font-mono retro-glow-text">
                JOB.MATCH(
                <br />
                <span className="text-emerald-400 animate-retro-glow">INDIAN_STYLE</span>
                )
              </h1>
              
              <div className="flex items-center justify-center space-x-3 mb-6">
                <Terminal className="w-6 h-6 text-emerald-400 animate-pulse" />
                <span className="text-emerald-400 font-mono text-lg tracking-wider retro-text">
                  [SIMA_APPROVED_CAREERS.EXE]
                </span>
                <Terminal className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              
              <div className="space-y-3 text-slate-300 font-mono">
                <p className="text-xl md:text-2xl">
                  <span className="text-emerald-400">&gt;</span> PERFECT_MATCH = FALSE
                </p>
                <p className="text-xl md:text-2xl">
                  <span className="text-emerald-400">&gt;</span> RIGHT_MATCH = <span className="text-emerald-400 font-bold">TRUE</span>
                </p>
                <p className="text-lg text-slate-400">
                  <span className="text-slate-500">{'// '}</span>NO_COMPROMISE • NO_TIMEPASS • JUST_RESULTS
                </p>
              </div>
            </div>
          </div>

          {/* Retro CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button
              onClick={handleBetaAccess}
              className="group retro-button retro-text px-12 py-4 rounded-xl text-lg font-bold text-slate-900 bg-gradient-to-r from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-emerald-300/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
              <Heart className="w-5 h-5 relative z-10" />
              <span className="relative z-10">FIND_MY_RISHTA()</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={handleBetaAccess}
              className="group retro-button retro-text px-12 py-4 rounded-xl text-lg font-bold text-emerald-400 transition-all duration-300 flex items-center justify-center space-x-3"
            >
              <Briefcase className="w-5 h-5 group-hover:scale-110 transition-transform" />
              <span>INIT_HIRING()</span>
            </button>
          </div>

          {/* Live Terminal Demo */}
          <div className="max-w-2xl mx-auto">
            <div className="retro-terminal rounded-3xl p-6 relative overflow-hidden">
              <div className="absolute top-4 left-4 flex space-x-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
              </div>
              
              <div className="pt-8">
                <div className="flex items-center justify-between mb-4 font-mono">
                  <div className="flex items-center space-x-3">
                    <Terminal className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold tracking-wider">AI_ENGINE.EXE</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-emerald-400 font-mono text-lg font-bold">
                      <AnimatedCounter end={Math.round(loadingProgress)} suffix="%" />
                    </span>
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  </div>
                </div>

                <div className="w-full retro-border rounded-lg h-3 mb-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-3 transition-all duration-300 relative"
                    style={{ width: `${loadingProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-emerald-300/50 animate-pulse"></div>
                  </div>
                </div>

                <div className="text-emerald-400 font-mono text-sm h-6 overflow-hidden">
                  <div
                    className="transition-transform duration-500"
                    style={{ transform: `translateY(-${currentPhase * 24}px)` }}
                  >
                    {phases.map((phase, index) => (
                      <div key={index} className="h-6 flex items-center">
                        <Cpu className="w-4 h-4 mr-2 animate-spin" />
                        <span className="tracking-wider">{phase}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-10 py-24 px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <div className="retro-terminal rounded-2xl px-8 py-4 inline-block mb-8">
              <div className="flex items-center space-x-3 font-mono text-emerald-400 text-lg font-bold tracking-wider">
                <Terminal className="w-5 h-5 animate-pulse" />
                <span>[HOW_IT_WORKS.EXE]</span>
                <Terminal className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight font-mono retro-glow-text">
              FROM_RESUME_TO
              <br />
              <span className="text-emerald-400 animate-retro-glow">
                DREAM_JOB()
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-mono">
              <span className="text-slate-500">{'// '}</span>THREE SIMPLE COMMANDS TO SUCCESS
            </p>
          </div>

          {/* Interactive Demo */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/60 border border-emerald-500/20 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="text-center mb-8">
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <div className="w-8 h-8 bg-emerald-400/10 rounded-lg flex items-center justify-center">
                      <Play className="w-4 h-4 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Try Our AI Engine</h3>
                  </div>
                  <p className="text-slate-400">Upload your resume and watch the magic happen</p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div className="order-2 md:order-1">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <span className="text-white font-medium">Resume Parsed</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="flex items-center space-x-3">
                          <Bot className="w-5 h-5 text-purple-400" />
                          <span className="text-white font-medium">Skills Extracted</span>
                        </div>
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                        <div className="flex items-center space-x-3">
                          <Target className="w-5 h-5 text-amber-400" />
                          <span className="text-white font-medium">Jobs Matched</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-emerald-400 font-bold">
                            <AnimatedCounter end={47} />
                          </span>
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-1 md:order-2">
                    <div className="border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center hover:border-emerald-400/50 transition-all duration-300 cursor-pointer group">
                      <div className="group-hover:scale-105 transition-transform">
                        <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4 group-hover:text-emerald-400 transition-colors" />
                        <p className="text-slate-400 font-medium mb-2">Drop your resume here</p>
                        <p className="text-slate-500 text-sm">PDF, DOC, DOCX supported</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-8">
                  <button
                    onClick={handleBetaAccess}
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-900 font-bold px-8 py-4 rounded-2xl transition-all duration-300 inline-flex items-center space-x-3 shadow-xl hover:shadow-emerald-500/25 transform hover:-translate-y-1"
                  >
                    <Rocket className="w-5 h-5" />
                    <span>Try Demo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="relative z-10 py-24 px-6 lg:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-20">
            <div className="retro-terminal rounded-2xl px-8 py-4 inline-block mb-8">
              <div className="flex items-center space-x-3 font-mono text-amber-400 text-lg font-bold tracking-wider">
                <Crown className="w-5 h-5 animate-pulse" />
                <span>[PRICING_MATRIX.EXE]</span>
                <Crown className="w-5 h-5 animate-pulse" />
              </div>
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white mb-6 tracking-tight font-mono retro-glow-text">
              SELECT_YOUR
              <br />
              <span className="text-amber-400 animate-retro-glow">
                ACCESS_LEVEL()
              </span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-mono">
              <span className="text-slate-500">{'// '}</span>START_FREE, UPGRADE_FOR_POWER
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier) => (
              <div
                key={tier.id}
                className={`relative p-8 rounded-3xl border transition-all duration-500 hover:scale-105 backdrop-blur-sm ${
                  tier.popular
                    ? "border-amber-400/50 bg-gradient-to-br from-amber-500/10 via-slate-900/80 to-orange-500/10 shadow-2xl shadow-amber-500/20"
                    : "border-slate-800/50 bg-gradient-to-br from-slate-900/50 to-slate-800/30 hover:border-emerald-400/30"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                      <Crown className="w-4 h-4 inline mr-2" />
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center mb-8">
                  <div className={`w-20 h-20 bg-gradient-to-br ${tier.popular ? 'from-amber-400/20 to-orange-400/20 border-amber-400/30' : 'from-emerald-400/10 to-teal-400/10 border-emerald-400/20'} border rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                    {(() => {
                      const IconComponent = iconMap[tier.icon as keyof typeof iconMap];
                      return <IconComponent className={`w-10 h-10 ${tier.popular ? 'text-amber-400' : 'text-emerald-400'}`} />;
                    })()}
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">{tier.title}</h3>
                  <p className="text-slate-400 mb-6">{tier.subtitle}</p>
                  <div className="flex items-baseline justify-center space-x-2">
                    <span className={`text-5xl font-black ${tier.popular ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {tier.price}
                    </span>
                    <span className="text-slate-400 text-lg">/{tier.period}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {tier.features.map((feature, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-3 p-3 rounded-xl transition-all ${
                        feature.locked 
                          ? 'bg-slate-800/30 border border-slate-700/50 cursor-pointer hover:bg-slate-800/50' 
                          : 'bg-slate-800/50 border border-slate-700/30'
                      }`}
                      onClick={() => {
                        if (feature.locked) {
                          const lockedFeature = LOCKED_FEATURES.find(f => f.title.toLowerCase().includes(feature.name.toLowerCase().split(' ')[0]));
                          if (lockedFeature) {
                            setSelectedFeature(lockedFeature);
                            setShowFeatureLock(true);
                          }
                        }
                      }}
                    >
                      {feature.included ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <Lock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      )}
                      <span className={`${feature.included ? 'text-slate-300' : 'text-slate-400'} ${feature.locked ? 'group-hover:text-white' : ''}`}>
                        {feature.name}
                      </span>
                      {feature.locked && (
                        <Crown className="w-4 h-4 text-amber-400 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleBetaAccess}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                    tier.popular
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 shadow-xl hover:shadow-amber-500/25 transform hover:-translate-y-1"
                      : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-emerald-400"
                  }`}
                >
                  {tier.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modals */}
      <BetaSignupModal
        isOpen={showBetaModal}
        onClose={() => setShowBetaModal(false)}
      />
      
      <FeatureLockModal
        isOpen={showFeatureLock}
        onClose={() => setShowFeatureLock(false)}
        feature={selectedFeature}
      />
    </div>
  );
}
