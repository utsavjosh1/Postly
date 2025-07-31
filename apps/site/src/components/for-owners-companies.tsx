"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Building, TrendingUp, DollarSign, Target, Zap } from "lucide-react"

export function ForOwnersCompanies() {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const ownerBenefits = [
    {
      icon: Users,
      title: "Grow Your Community",
      description: "Transform your Discord into a valuable career hub that members actively engage with daily.",
    },
    {
      icon: TrendingUp,
      title: "Increase Engagement",
      description: "Fresh job content keeps members active and attracts new users to your server.",
    },
    {
      icon: DollarSign,
      title: "Generate Revenue",
      description: "Earn from premium company listings and revenue sharing opportunities.",
    },
  ]

  const companyBenefits = [
    {
      icon: Target,
      title: "Reach Targeted Talent",
      description: "Connect with engaged communities in your industry or skill area.",
    },
    {
      icon: Zap,
      title: "Instant Visibility",
      description: "Get your jobs seen immediately across multiple Discord servers and Twitter.",
    },
    {
      icon: Building,
      title: "Premium Placement",
      description: "Featured listings with priority placement and enhanced visibility options.",
    },
  ]

  return (
    <section ref={sectionRef} className="py-32 bg-gradient-to-b from-slate-950 to-slate-900 relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 max-w-7xl mx-auto">
          {/* For Server Owners */}
          <div
            className={`${isVisible ? "animate-in slide-in-from-bottom-4 duration-1000" : "opacity-0 translate-y-8"}`}
          >
            <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 px-4 py-2 font-mono tracking-wider mb-6">
              FOR SERVER OWNERS
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 font-mono tracking-wide">
              BUILD A THRIVING
              <br />
              <span className="text-cyan-400">CAREER COMMUNITY</span>
            </h3>
            <p className="text-lg text-slate-400 font-mono leading-relaxed mb-8">
              Transform your Discord server into a valuable career resource that members love and actively engage with.
            </p>

            <div className="space-y-6 mb-8">
              {ownerBenefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/50 transition-colors duration-300 flex-shrink-0">
                        <benefit.icon className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2 font-mono group-hover:text-cyan-400 transition-colors duration-300">
                          {benefit.title}
                        </h4>
                        <p className="text-slate-300 font-mono text-sm leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono font-bold px-8 py-3 border border-cyan-400 shadow-lg hover:shadow-cyan-400/50 transition-all duration-300 transform hover:scale-105">
              START BUILDING YOUR COMMUNITY
            </Button>
          </div>

          {/* For Companies */}
          <div
            className={`${
              isVisible ? "animate-in slide-in-from-bottom-4 duration-1000 delay-300" : "opacity-0 translate-y-8"
            }`}
          >
            <Badge className="bg-purple-500/20 text-purple-400 border border-purple-400/50 px-4 py-2 font-mono tracking-wider mb-6">
              FOR COMPANIES
            </Badge>
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 font-mono tracking-wide">
              REACH THOUSANDS
              <br />
              <span className="text-purple-400">OF CANDIDATES</span>
            </h3>
            <p className="text-lg text-slate-400 font-mono leading-relaxed mb-8">
              Get your job listings in front of engaged communities and active job seekers across Discord and Twitter.
            </p>

            <div className="space-y-6 mb-8">
              {companyBenefits.map((benefit, index) => (
                <Card
                  key={index}
                  className="bg-slate-800/50 border border-slate-700 hover:border-purple-400/50 transition-all duration-300 group"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-400/20 to-pink-500/20 rounded-xl flex items-center justify-center border border-purple-400/30 group-hover:border-purple-400/50 transition-colors duration-300 flex-shrink-0">
                        <benefit.icon className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white mb-2 font-mono group-hover:text-purple-400 transition-colors duration-300">
                          {benefit.title}
                        </h4>
                        <p className="text-slate-300 font-mono text-sm leading-relaxed">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button className="bg-purple-500 hover:bg-purple-400 text-white font-mono font-bold px-8 py-3 border border-purple-400 shadow-lg hover:shadow-purple-400/50 transition-all duration-300 transform hover:scale-105">
              LIST YOUR JOBS NOW
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
