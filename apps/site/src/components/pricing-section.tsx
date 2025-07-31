"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, Rocket, Sparkles, ArrowRight, Star } from "lucide-react"

export function PricingSection() {
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  console.log("hoveredPlan", hoveredPlan)

  const plans = [
    {
      name: "Starter",
      monthlyPrice: 0,
      yearlyPrice: 0,
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      icon: Zap,
      gradient: "from-slate-600 to-slate-700",
      borderColor: "border-slate-600",
      glowColor: "slate-400",
      popular: false,
      description: "Perfect for individuals getting started",
      features: [
        "AI job matching from 10+ platforms",
        "Up to 100 jobs per day",
        "Basic Discord integration",
        "Email notifications",
        "Community support",
        "Job filtering by location & role"
      ],
      limitations: ["Limited to 3 applications per day"]
    },
    {
      name: "Professional",
      monthlyPrice: 29,
      yearlyPrice: 290, // 2 months free
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      icon: Crown,
      gradient: "from-cyan-500 to-blue-600",
      borderColor: "border-cyan-400",
      glowColor: "cyan-400",
      popular: true,
      description: "Best for active job seekers",
      features: [
        "Everything in Starter",
        "Advanced AI matching from 50+ platforms",
        "Unlimited applications per day",
        "Resume optimization suggestions",
        "One-click Discord applications",
        "Interview preparation tips",
        "Salary insights & negotiation tips",
        "Priority customer support",
        "Custom job alerts",
        "Application tracking dashboard"
      ],
      limitations: []
    },
    {
      name: "Enterprise",
      monthlyPrice: 99,
      yearlyPrice: 990, // 2 months free
      period: billingPeriod === 'monthly' ? '/month' : '/year',
      icon: Rocket,
      gradient: "from-purple-500 to-pink-600",
      borderColor: "border-purple-400",
      glowColor: "purple-400",
      popular: false,
      description: "For teams and organizations",
      features: [
        "Everything in Professional",
        "Multi-user team dashboard",
        "Company job posting tools",
        "Advanced analytics & reporting",
        "White-label Discord bot",
        "Custom integrations & API access",
        "Dedicated account manager",
        "SLA guarantee (99.9% uptime)",
        "Custom training sessions",
        "Advanced security features"
      ],
      limitations: []
    },
  ]

  const getPrice = (plan: typeof plans[0]) => {
    const price = billingPeriod === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice
    return price === 0 ? 'Free' : `$${price}`
  }

  const getSavings = (plan: typeof plans[0]) => {
    if (billingPeriod === 'yearly' && plan.monthlyPrice > 0) {
      const monthlyCost = plan.monthlyPrice * 12
      const savings = monthlyCost - plan.yearlyPrice
      return Math.round((savings / monthlyCost) * 100)
    }
    return 0
  }

  const scrollToSignup = () => {
    const element = document.getElementById("signup")
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
    <section id="pricing" ref={sectionRef} className="py-20 lg:py-32 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `
                linear-gradient(45deg, rgba(6, 182, 212, 0.8) 1px, transparent 1px),
                linear-gradient(-45deg, rgba(6, 182, 212, 0.8) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
        </div>
        
        {/* Floating gradient orbs */}
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        {/* Enhanced Section Header */}
        <div className={`text-center mb-16 lg:mb-20 max-w-4xl mx-auto transform transition-all duration-1000 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <Badge className="bg-gradient-to-r from-purple-500/20 to-cyan-500/20 text-purple-400 border border-purple-400/30 px-6 py-3 font-medium mb-8 text-sm backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            Simple Pricing
          </Badge>
          
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-white mb-6 leading-tight">
            Choose Your
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Career Path
            </span>
          </h2>
          
          <p className="text-lg lg:text-xl text-slate-300 leading-relaxed mb-8">
            Flexible pricing for individuals, professionals, and teams. Start free and upgrade as you grow.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm font-medium ${billingPeriod === 'monthly' ? 'text-white' : 'text-slate-400'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-14 h-7 bg-slate-700 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              <div className={`absolute w-5 h-5 rounded-full bg-white transition-transform duration-300 top-1 ${
                billingPeriod === 'yearly' ? 'translate-x-8' : 'translate-x-1'
              }`} />
              {billingPeriod === 'yearly' && (
                <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-400" />
              )}
            </button>
            <span className={`text-sm font-medium ${billingPeriod === 'yearly' ? 'text-white' : 'text-slate-400'}`}>
              Yearly
            </span>
            {billingPeriod === 'yearly' && (
              <Badge className="bg-green-500/20 text-green-400 border border-green-400/30 text-xs">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Enhanced Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const savings = getSavings(plan)
            return (
              <Card
                key={index}
                className={`relative bg-slate-900/40 border transition-all duration-500 group hover:scale-105 hover:-translate-y-2 backdrop-blur-sm ${
                  plan.popular 
                    ? 'border-cyan-400/50 shadow-2xl shadow-cyan-400/20' 
                    : 'border-slate-700/50 hover:border-slate-600'
                } ${isVisible ? 'animate-slide-up opacity-100' : 'opacity-0 translate-y-8'}`}
                style={{ 
                  animationDelay: `${index * 200}ms`,
                  animationFillMode: 'forwards'
                }}
                onMouseEnter={() => setHoveredPlan(index)}
                onMouseLeave={() => setHoveredPlan(null)}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-900 font-semibold px-4 py-1 shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Savings Badge */}
                {savings > 0 && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-green-500/20 text-green-400 border border-green-400/30 font-medium text-xs px-2 py-1">
                      Save {savings}%
                    </Badge>
                  </div>
                )}

                {/* Enhanced Hover Effects */}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.popular ? 'from-cyan-400/10 via-transparent to-blue-400/10' : 'from-slate-400/5 via-transparent to-slate-400/5'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <CardHeader className="pb-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${plan.gradient} rounded-xl flex items-center justify-center shadow-lg ${plan.popular ? 'group-hover:scale-110' : ''} transition-transform duration-300`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{plan.description}</p>
                  
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold text-white">{getPrice(plan)}</span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-slate-400 text-sm">{plan.period}</span>
                    )}
                  </div>
                  
                  {billingPeriod === 'yearly' && plan.monthlyPrice > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      Billed annually (${plan.yearlyPrice}/year)
                    </p>
                  )}
                </CardHeader>

                <CardContent className="pt-0 relative z-10">
                  <Button
                    onClick={scrollToSignup}
                    className={`w-full mb-6 font-semibold transition-all duration-300 ${
                      plan.popular
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-900 shadow-lg hover:shadow-cyan-400/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {plan.monthlyPrice === 0 ? 'Start Free' : 'Start Free Trial'}
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5">
                          <Check className="w-3 h-3 text-green-400" />
                        </div>
                        <span className="text-slate-300 text-sm leading-relaxed">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations && plan.limitations.map((limitation, limitIndex) => (
                      <div key={limitIndex} className="flex items-start space-x-3 opacity-60">
                        <div className="flex-shrink-0 w-5 h-5 bg-slate-600/50 rounded-full flex items-center justify-center mt-0.5">
                          <div className="w-2 h-0.5 bg-slate-400 rounded" />
                        </div>
                        <span className="text-slate-400 text-sm leading-relaxed">{limitation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom Section */}
        <div className={`text-center mt-16 lg:mt-20 transform transition-all duration-1000 delay-500 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
        }`}>
          <p className="text-slate-400 mb-8 text-lg">
            All plans include a 14-day free trial. No credit card required.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Badge className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 text-green-400 border border-green-400/30 px-4 py-2 font-medium">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse" />
              30-day money-back guarantee
            </Badge>
            <Badge className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-400/30 px-4 py-2 font-medium">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse" />
              Cancel anytime
            </Badge>
          </div>
        </div>
      </div>
    </section>
  )
}
