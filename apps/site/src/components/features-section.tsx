"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, FileText, MousePointer, Twitter, Building, Settings, Sparkles, ArrowRight } from "lucide-react"

export function FeaturesSection() {
  const [visibleCards, setVisibleCards] = useState<number[]>([])
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cardIndex = Number.parseInt(entry.target.getAttribute("data-index") || "0")
            setVisibleCards((prev) => [...new Set([...prev, cardIndex])])
          }
        })
      },
      { threshold: 0.1 },
    )

    const cards = sectionRef.current?.querySelectorAll("[data-index]")
    cards?.forEach((card) => observer.observe(card))

    return () => observer.disconnect()
  }, [])

  const features = [
    {
      icon: Bot,
      title: "AI Job Matching",
      description: "Advanced AI algorithms scan 50+ job platforms daily, automatically posting perfect matches to your Discord channels with rich embeds and instant notifications.",
      status: "Live",
      statusColor: "green",
      metrics: "15K+ jobs daily"
    },
    {
      icon: FileText,
      title: "Smart Applications",
      description: "Upload your resume once and let our AI apply to relevant positions automatically. Personalized cover letters and application tracking included.",
      status: "Beta",
      statusColor: "purple",
      metrics: "89% success rate"
    },
    {
      icon: MousePointer,
      title: "One-Click Apply",
      description: "Apply to jobs directly from Discord with a single click. No more tab switching or form filling - just instant applications.",
      status: "Live",
      statusColor: "green",
      metrics: "< 30s application"
    },
    {
      icon: Twitter,
      title: "Social Reach",
      description: "Automatically share job opportunities across social platforms. Expand your network and help others find their dream careers.",
      status: "Live",
      statusColor: "blue",
      metrics: "2.3M reach/month"
    },
    {
      icon: Building,
      title: "Company Portal",
      description: "Dedicated dashboard for companies to post jobs, view applications, and manage their hiring pipeline directly through Discord.",
      status: "Pro",
      statusColor: "amber",
      metrics: "500+ companies"
    },
    {
      icon: Settings,
      title: "Advanced Controls",
      description: "Fine-tune job filtering, set posting schedules, manage categories, and control every aspect of your job board with powerful admin tools.",
      status: "Live",
      statusColor: "green",
      metrics: "50+ filters"
    },
  ]

  const getStatusColors = (color: string) => {
    switch (color) {
      case "green":
        return "border-green-400 text-green-400 bg-green-400/10"
      case "blue":
        return "border-blue-400 text-blue-400 bg-blue-400/10"
      case "purple":
        return "border-purple-400 text-purple-400 bg-purple-400/10"
      case "amber":
        return "border-amber-400 text-amber-400 bg-amber-400/10"
      default:
        return "border-cyan-400 text-cyan-400 bg-cyan-400/10"
    }
  }

  return (
    <section id="features" ref={sectionRef} className="py-20 lg:py-32 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                radial-gradient(circle at 2px 2px, rgba(6, 182, 212, 0.8) 1px, transparent 0)
              `,
              backgroundSize: "80px 80px",
            }}
          />
        </div>
        
        {/* Floating gradient orbs */}
        <div className="absolute top-1/4 left-1/6 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Enhanced Section Header */}
        <div className="text-center mb-16 lg:mb-20 max-w-4xl mx-auto">
          <Badge className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-400/30 px-6 py-3 font-medium mb-8 text-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            Powerful Features
          </Badge>
          
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-white mb-6 leading-tight">
            Everything You Need
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              For Career Success
            </span>
          </h2>
          
          <p className="text-lg lg:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto">
            Transform your job search with AI-powered automation, smart matching, and seamless Discord integration.
          </p>
        </div>

        {/* Enhanced Features Grid */}
        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-6 lg:gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => (
            <Card
              key={index}
              data-index={index}
              className={`bg-slate-900/40 border border-slate-700/50 hover:border-cyan-400/30 transition-all duration-700 group relative overflow-hidden backdrop-blur-sm hover:bg-slate-900/60 hover:scale-105 hover:-translate-y-2 ${
                visibleCards.includes(index)
                  ? "animate-slide-up opacity-100"
                  : "opacity-0 translate-y-8"
              }`}
              style={{ 
                animationDelay: `${index * 150}ms`,
                animationFillMode: 'forwards'
              }}
            >
              {/* Enhanced Hover Effects */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 via-transparent to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 to-blue-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />

              <CardContent className="p-6 lg:p-8 relative z-10">
                {/* Enhanced Icon and Status */}
                <div className="flex items-start justify-between mb-6">
                  <div className="relative">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl flex items-center justify-center border border-slate-600 group-hover:border-cyan-400/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                      <feature.icon className="w-7 h-7 lg:w-8 lg:h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full border-2 border-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
                  </div>
                  
                  <div className="text-right">
                    <Badge
                      variant="outline"
                      className={`font-medium text-xs px-3 py-1 mb-2 ${getStatusColors(feature.statusColor)}`}
                    >
                      {feature.status}
                    </Badge>
                    <div className="text-xs text-slate-400 font-mono">{feature.metrics}</div>
                  </div>
                </div>

                {/* Enhanced Content */}
                <h3 className="text-xl lg:text-2xl font-bold text-white mb-4 group-hover:text-cyan-400 transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-slate-300 text-sm lg:text-base leading-relaxed mb-6 group-hover:text-slate-200 transition-colors duration-300">
                  {feature.description}
                </p>

                {/* Learn More Link */}
                <div className="flex items-center text-cyan-400 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer hover:text-cyan-300">
                  <span className="text-sm font-medium">Learn more</span>
                  <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 lg:mt-20">
          <p className="text-slate-400 mb-6 text-lg">Ready to transform your job search?</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Badge className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-green-400 border border-green-400/30 px-4 py-2 font-medium">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              Free trial • No credit card required
            </Badge>
          </div>
        </div>
      </div>
    </section>
  )
}
