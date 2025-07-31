"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot,  Briefcase, Users, Zap, ChevronDown, Play } from "lucide-react"

export function HeroSection() {
  const [titleIndex, setTitleIndex] = useState(0)
  const [subtitleIndex, setSubtitleIndex] = useState(0)
  const [showCursor, setShowCursor] = useState(true)
  const [isVisible, setIsVisible] = useState(false)

  const title = "AUTOMATE YOUR JOB SEARCH"
  const subtitle = "AI-powered job matching • Instant applications • Discord integration"

  useEffect(() => {
    setIsVisible(true)
    // Title typewriter with smoother timing
    if (titleIndex < title.length) {
      const timer = setTimeout(() => setTitleIndex(titleIndex + 1), 50)
      return () => clearTimeout(timer)
    } else if (subtitleIndex < subtitle.length) {
      const timer = setTimeout(() => setSubtitleIndex(subtitleIndex + 1), 30)
      return () => clearTimeout(timer)
    }
  }, [titleIndex, subtitleIndex, title.length, subtitle.length])

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((prev) => !prev), 400)
    return () => clearInterval(interval)
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const headerOffset = 80
      const elementPosition = element.offsetTop
      const offsetPosition = elementPosition - headerOffset
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  return (
    <section id="hero" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden flex items-center">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        {/* Animated Grid */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.8) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.8) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
              animation: "grid-move 20s linear infinite"
            }}
          />
        </div>
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10 pt-20">
        <div className="max-w-6xl mx-auto text-center">
          {/* Status Badge with enhanced animation */}
          <div className={`mb-8 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
            <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/30 px-6 py-3 font-medium text-sm backdrop-blur-sm hover:border-cyan-400/50 transition-all duration-300">
              <div className="w-2 h-2 bg-gradient-to-r from-green-400 to-cyan-400 rounded-full mr-3 animate-pulse" />
              Live • 15K+ Jobs Found Today • 2.3K Applications Sent
            </Badge>
          </div>

          {/* Main Title with gradient animation */}
          <div className={`mb-6 transform transition-all duration-1000 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-white leading-tight">
              {title.slice(0, titleIndex)}
              {titleIndex === title.length && subtitleIndex < subtitle.length && showCursor && (
                <span className="text-cyan-400 animate-pulse">|</span>
              )}
            </h1>
          </div>

          {/* Enhanced subtitle */}
          <div className={`mb-12 transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <p className="text-lg md:text-xl lg:text-2xl text-slate-300 leading-relaxed max-w-4xl mx-auto">
              {subtitle.slice(0, subtitleIndex)}
              {subtitleIndex === subtitle.length && showCursor && (
                <span className="animate-pulse text-cyan-400 ml-1">_</span>
              )}
            </p>
          </div>

          {/* Enhanced Terminal Stats */}
          <div className={`mb-12 transform transition-all duration-1000 delay-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <div className="bg-slate-900/40 border border-cyan-400/20 rounded-2xl p-6 lg:p-8 max-w-4xl mx-auto backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-500 group">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                  </div>
                  <span className="text-slate-400 text-sm font-mono">jobbot@ai-system</span>
                </div>
                <div className="text-xs text-slate-500 font-mono">Real-time data</div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {[
                  { label: "Jobs Scraped", value: "12,847", change: "+2.3K" },
                  { label: "AI Matches", value: "3,291", change: "+847" },
                  { label: "Applications", value: "1,847", change: "+423" },
                  { label: "Interviews", value: "247", change: "+18" }
                ].map((stat, index) => (
                  <div key={index} className="text-center group-hover:scale-105 transition-transform duration-300" style={{transitionDelay: `${index * 100}ms`}}>
                    <div className="text-xl lg:text-2xl font-bold text-cyan-400 mb-1">{stat.value}</div>
                    <div className="text-xs text-slate-400 mb-1">{stat.label}</div>
                    <div className="text-xs text-green-400 font-mono">{stat.change} today</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced CTA Buttons */}
          <div className={`flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center mb-16 transform transition-all duration-1000 delay-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            <Button
              onClick={() => scrollToSection("discord-setup")}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-900 font-semibold px-8 lg:px-10 py-3 lg:py-4 text-base lg:text-lg border border-cyan-400/50 shadow-xl hover:shadow-cyan-400/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 relative overflow-hidden group min-w-[200px]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <Bot className="w-5 h-5 mr-3 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Start Free Trial</span>
            </Button>
            
            <Button
              onClick={() => scrollToSection("features")}
              size="lg"
              variant="outline"
              className="border-2 border-slate-600 text-slate-300 hover:border-cyan-400 hover:text-cyan-400 hover:bg-cyan-400/5 px-8 lg:px-10 py-3 lg:py-4 text-base lg:text-lg bg-transparent transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 group min-w-[200px]"
            >
              <Play className="w-4 h-4 mr-3 group-hover:translate-x-1 transition-transform duration-300" />
              <span>Watch Demo</span>
            </Button>
          </div>

          {/* Enhanced Stats Grid */}
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto transform transition-all duration-1000 delay-1200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
            {[
              { icon: Briefcase, label: "15K+ Jobs", value: "Daily Matches", color: "from-cyan-400 to-blue-400" },
              { icon: Users, label: "8K+ Users", value: "Active Today", color: "from-blue-400 to-purple-400" },
              { icon: Zap, label: "< 30s", value: "Application Time", color: "from-purple-400 to-pink-400" },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-slate-900/30 border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-400/30 transition-all duration-500 group hover:bg-slate-900/50 hover:scale-105 hover:-translate-y-2"
                style={{transitionDelay: `${index * 100}ms`}}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-slate-900" />
                </div>
                <div className="text-white font-semibold text-lg mb-1">{stat.label}</div>
                <div className="text-slate-400 text-sm">{stat.value}</div>
              </div>
            ))}
          </div>

          {/* Enhanced Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => scrollToSection("features")}
              className="text-cyan-400/60 hover:text-cyan-400 transition-all duration-300 animate-bounce hover:scale-110 p-2 rounded-full hover:bg-cyan-400/10"
              aria-label="Scroll to features"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
