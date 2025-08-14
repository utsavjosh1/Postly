"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { Upload, Wand2, Briefcase, GitBranch, Sparkles } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "@/constants";

export const HowDiagram: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeStep, setActiveStep] = useState(-1); // Start with -1 so animation doesn't auto-start
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iconMap = {
    Upload: Upload,
    Wand2: Wand2,
    Briefcase: Briefcase,
  };

  const startAnimation = useCallback(() => {
    if (isAnimating) return;

    setIsAnimating(true);
    setActiveStep(0);
    setHasAnimated(true);

    // Run through each step
    const timeouts: NodeJS.Timeout[] = [];

    HOW_IT_WORKS_STEPS.forEach((_, index) => {
      const timeout = setTimeout(() => {
        setActiveStep(index);

        // Reset animation when complete
        if (index === HOW_IT_WORKS_STEPS.length - 1) {
          setTimeout(() => {
            setIsAnimating(false);
          }, 3000);
        }
      }, index * 3000);

      timeouts.push(timeout);
    });

    // Cleanup function
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
    };
  }, [isAnimating]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setIsVisible(true);
          startAnimation();
        }
      },
      { threshold: 0.5 }, // Trigger when 50% of component is visible
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [hasAnimated, startAnimation]);

  const replayAnimation = useCallback(() => {
    setActiveStep(-1);
    setIsAnimating(false);

    // Small delay before restarting
    setTimeout(() => {
      startAnimation();
    }, 100);
  }, [startAnimation]);

  useEffect(() => {
    // Remove the auto-cycling interval
    return () => {};
  }, []);
  return (
    <section
      ref={containerRef}
      id="how"
      className="mx-auto max-w-[1440px] px-6 py-20 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-pulse" />
        <div
          className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-cyan-400/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-24 h-24 bg-gradient-to-br from-pink-400/20 to-orange-400/20 rounded-full blur-xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10 rounded-3xl border border-border/20 bg-card/40 backdrop-blur-2xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-700 group">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 text-primary mb-4">
            <div className="relative">
              <GitBranch className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
              <Sparkles className="w-3 h-3 absolute -top-1 -right-1 text-yellow-400 animate-pulse" />
            </div>
            <div className="text-base font-bold tracking-wide">
              HOW IT WORKS
            </div>
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            From Resume to Dream Job
          </h3>
          <p className="text-muted-foreground mt-2 text-lg">
            AI-powered matching in three simple steps
          </p>

          {/* Replay Animation Button */}
          <div className="mt-6">
            <button
              onClick={replayAnimation}
              disabled={isAnimating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {isAnimating ? "Playing..." : "Replay Animation"}
            </button>
          </div>
        </div>{" "}
        {/* Single Flowing Journey Animation */}
        <div className="relative min-h-[500px] mb-12 overflow-hidden">
          {/* Journey Path */}
          <div className="absolute inset-0 flex items-center justify-between px-8">
            {/* Stage 1: Upload Zone */}
            <div className="relative">
              <div
                className={`w-64 h-48 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/30 flex flex-col items-center justify-center transition-all duration-1000 ${
                  activeStep >= 0
                    ? "border-solid border-blue-500 bg-blue-100/70 dark:bg-blue-900/50"
                    : ""
                }`}
              >
                <Upload className="w-12 h-12 text-blue-500 mb-3" />
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Upload Zone
                </p>
              </div>
            </div>

            {/* Stage 2: Processing Zone */}
            <div className="relative">
              <div
                className={`w-64 h-48 rounded-xl bg-gray-900 border-2 border-gray-700 flex flex-col transition-all duration-1000 overflow-hidden ${
                  activeStep >= 1
                    ? "border-green-500 shadow-green-500/30 shadow-lg"
                    : ""
                }`}
              >
                {/* Terminal header */}
                <div className="bg-gray-800 px-3 py-2 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-300 ml-2">
                    AI Processor
                  </span>
                </div>
                <div className="flex-1 p-3 flex items-center justify-center">
                  <div className="text-center">
                    <Wand2 className="w-10 h-10 text-green-400 mb-2 mx-auto" />
                    <p className="text-xs text-green-400">Processing...</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stage 3: Results Zone */}
            <div className="relative">
              <div
                className={`w-64 h-48 rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 flex flex-col items-center justify-center transition-all duration-1000 ${
                  activeStep >= 2
                    ? "border-solid border-emerald-500 bg-emerald-100/70 dark:bg-emerald-900/50 shadow-emerald-500/30 shadow-lg"
                    : ""
                }`}
              >
                <Briefcase className="w-12 h-12 text-emerald-600 mb-3" />
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Job Matches
                </p>
              </div>
            </div>
          </div>

          {/* Traveling Resume Document */}
          <div
            className={`absolute transition-all duration-2000 ease-in-out transform ${
              activeStep === -1
                ? "left-8 top-1/2 -translate-y-1/2 translate-x-20"
                : activeStep === 0
                  ? "left-8 top-1/2 -translate-y-1/2 translate-x-20"
                  : activeStep === 1
                    ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    : "right-8 top-1/2 -translate-y-1/2 -translate-x-20"
            }`}
          >
            <div
              className={`relative transition-all duration-1000 ${
                activeStep === -1 || activeStep === 0
                  ? "w-24 h-32"
                  : activeStep === 1
                    ? "w-32 h-20"
                    : "w-28 h-36"
              }`}
            >
              {/* Resume in Upload State */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  activeStep <= 0 ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="w-24 h-32 bg-white dark:bg-gray-100 border-2 border-gray-300 rounded-lg shadow-xl relative overflow-hidden">
                  <div className="absolute top-2 left-2 right-2">
                    <div className="text-xs font-bold text-center mb-1 text-gray-800">
                      RESUME
                    </div>
                    <div className="space-y-1">
                      <div className="h-1 bg-gray-400 rounded" />
                      <div className="h-1 bg-gray-400 rounded w-3/4" />
                      <div className="h-1 bg-gray-400 rounded w-1/2" />
                      <div className="mt-2 space-y-0.5">
                        <div className="h-0.5 bg-gray-300 rounded" />
                        <div className="h-0.5 bg-gray-300 rounded" />
                        <div className="h-0.5 bg-gray-300 rounded w-4/5" />
                      </div>
                    </div>
                  </div>
                  {/* Upload progress */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 h-2 bg-blue-500 transition-all duration-2000 ${
                      activeStep >= 0 ? "w-full" : "w-0"
                    }`}
                  />
                </div>
              </div>

              {/* Resume in Processing State (transformed to data stream) */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  activeStep === 1 ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="w-32 h-20 bg-gray-900 border border-green-500 rounded-lg shadow-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex space-x-1 mb-2 justify-center">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                    <div className="text-xs text-green-400 font-mono">
                      <div>analyzing...</div>
                      <div className="text-yellow-400">extracting</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Resume in Results State (transformed to job cards) */}
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  activeStep >= 2 ? "opacity-100" : "opacity-0"
                }`}
              >
                <div className="w-28 h-36 space-y-2">
                  <div className="bg-emerald-500 text-white p-2 rounded-lg text-xs font-medium text-center">
                    Senior Dev
                    <div className="text-emerald-100 text-xs">98% Match</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-emerald-300 p-2 rounded-lg text-xs text-center">
                    Full Stack
                    <div className="text-emerald-600 text-xs">95% Match</div>
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-emerald-300 p-2 rounded-lg text-xs text-center">
                    Lead Eng
                    <div className="text-emerald-600 text-xs">92% Match</div>
                  </div>
                </div>
              </div>

              {/* Floating sparkles during transitions */}
              <div
                className={`absolute -inset-4 pointer-events-none transition-opacity duration-300 ${
                  isAnimating ? "opacity-100" : "opacity-0"
                }`}
              >
                <Sparkles className="absolute top-0 right-0 w-4 h-4 text-yellow-400 animate-pulse" />
                <Sparkles
                  className="absolute bottom-0 left-0 w-3 h-3 text-blue-400 animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                />
                <Sparkles
                  className="absolute top-1/2 left-1/2 w-2 h-2 text-emerald-400 animate-pulse"
                  style={{ animationDelay: "1s" }}
                />
              </div>
            </div>
          </div>

          {/* Flowing connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <linearGradient id="flowLine" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop
                  offset="0%"
                  stopColor="rgb(59, 130, 246)"
                  stopOpacity="0.8"
                />
                <stop
                  offset="50%"
                  stopColor="rgb(34, 197, 94)"
                  stopOpacity="0.8"
                />
                <stop
                  offset="100%"
                  stopColor="rgb(16, 185, 129)"
                  stopOpacity="0.8"
                />
              </linearGradient>
            </defs>

            {/* Flow line from upload to processing */}
            <path
              d="M 200 250 Q 400 200 520 250"
              stroke="url(#flowLine)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="10,5"
              className={`transition-all duration-1000 ${
                activeStep >= 0 ? "opacity-100 animate-dash" : "opacity-0"
              }`}
            />

            {/* Flow line from processing to results */}
            <path
              d="M 720 250 Q 900 200 1040 250"
              stroke="url(#flowLine)"
              strokeWidth="3"
              fill="none"
              strokeDasharray="10,5"
              className={`transition-all duration-1000 ${
                activeStep >= 1 ? "opacity-100 animate-dash" : "opacity-0"
              }`}
              style={{ animationDelay: "0.5s" }}
            />

            {/* Moving particles */}
            {activeStep >= 0 && (
              <>
                <circle r="3" fill="rgb(59, 130, 246)" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite">
                    <path d="M 200 250 Q 400 200 520 250" />
                  </animateMotion>
                </circle>
                <circle r="2" fill="rgb(34, 197, 94)" opacity="0.6">
                  <animateMotion
                    dur="2.5s"
                    repeatCount="indefinite"
                    begin="0.3s"
                  >
                    <path d="M 200 250 Q 400 200 520 250" />
                  </animateMotion>
                </circle>
              </>
            )}

            {activeStep >= 1 && (
              <>
                <circle r="3" fill="rgb(34, 197, 94)" opacity="0.8">
                  <animateMotion dur="2s" repeatCount="indefinite" begin="0.5s">
                    <path d="M 720 250 Q 900 200 1040 250" />
                  </animateMotion>
                </circle>
                <circle r="2" fill="rgb(16, 185, 129)" opacity="0.6">
                  <animateMotion
                    dur="2.5s"
                    repeatCount="indefinite"
                    begin="0.8s"
                  >
                    <path d="M 720 250 Q 900 200 1040 250" />
                  </animateMotion>
                </circle>
              </>
            )}
          </svg>

          {/* Status indicators */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-8">
              <div
                className={`flex items-center gap-2 text-sm transition-all duration-500 ${
                  activeStep >= 0 ? "text-blue-600 scale-110" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    activeStep >= 0
                      ? "bg-blue-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                ></div>
                Upload Complete
              </div>
              <div
                className={`flex items-center gap-2 text-sm transition-all duration-500 ${
                  activeStep >= 1 ? "text-green-600 scale-110" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    activeStep >= 1
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                ></div>
                AI Processing
              </div>
              <div
                className={`flex items-center gap-2 text-sm transition-all duration-500 ${
                  activeStep >= 2
                    ? "text-emerald-600 scale-110"
                    : "text-gray-400"
                }`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-500 ${
                    activeStep >= 2
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-gray-300"
                  }`}
                ></div>
                Jobs Found
              </div>
            </div>
          </div>
        </div>
        {/* Original Step Cards - positioned below the morphing animation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {HOW_IT_WORKS_STEPS.map(({ iconName, title, desc }, index) => {
            const Icon = iconMap[iconName as keyof typeof iconMap];
            const isActive = activeStep === index;

            return (
              <div
                key={title}
                className={`rounded-xl border border-border/25 bg-background/60 hover:bg-background/80 p-6 text-center hover:shadow-md transition-all duration-300 backdrop-blur-sm group/step transform ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-12 opacity-0"
                } ${isActive ? "ring-2 ring-primary/50 scale-105" : ""}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`mx-auto h-12 w-12 rounded-full flex items-center justify-center border border-primary/25 bg-primary/8 shadow-sm group-hover/step:shadow-md transition-all duration-300 group-hover/step:scale-110 ${
                    isActive ? "bg-primary text-white" : ""
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : "text-primary"}`}
                  />
                </div>
                <div className="mt-4 text-sm font-semibold text-foreground">
                  {title}
                </div>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            );
          })}
        </div>
        {/* Step progress indicator */}
        <div className="flex justify-center mt-6 space-x-2">
          {HOW_IT_WORKS_STEPS.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                activeStep === index
                  ? "bg-primary scale-125"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        .animate-dash {
          animation: dash 2s linear infinite;
        }
      `}</style>
    </section>
  );
};
