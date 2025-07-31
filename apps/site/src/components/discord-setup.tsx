"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bot, Shield, Users, Zap, ExternalLink, CheckCircle, Wifi, WifiOff, Sparkles } from "lucide-react"

export function DiscordSetup() {
  const [isConnecting, setIsConnecting] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [pulseAnimation, setPulseAnimation] = useState(true)
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

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseAnimation((prev) => !prev)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleConnect = () => {
    setIsConnecting(true)
    // Simulate OAuth flow
    setTimeout(() => {
      setIsConnecting(false)
      setIsConnected(true)
    }, 3000)
  }

  const permissions = [
    {
      name: "Read Messages",
      icon: Shield,
      required: true,
      description: "View channel messages for job posting",
    },
    {
      name: "Send Messages",
      icon: Bot,
      required: true,
      description: "Post job listings and notifications",
    },
    {
      name: "Manage Messages",
      icon: Zap,
      required: true,
      description: "Pin important job posts",
    },
    {
      name: "Manage Roles",
      icon: Users,
      required: false,
      description: "Assign job seeker roles automatically",
    },
  ]

  return (
    <section
      id="discord-setup"
      ref={sectionRef}
      className="py-32 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden"
    >
      {/* Background Grid Animation */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full animate-pulse"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Section Header */}
          <div
            className={`text-center mb-16 ${
              isVisible ? "animate-in slide-in-from-bottom-4 duration-1000" : "opacity-0 translate-y-8"
            }`}
          >
            <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 px-6 py-3 font-mono tracking-wider mb-8 text-base">
              <Wifi className="w-4 h-4 mr-2" />
              DISCORD OAUTH
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 font-mono tracking-wide">
              CONNECT TO
              <br />
              <span className="text-cyan-400">DISCORD</span>
            </h2>
            <p className="text-xl text-slate-400 font-mono leading-relaxed">
              Authorize JobSync to join your Discord server with secure OAuth 2.0
            </p>
          </div>

          {/* Integration Card */}
          <Card
            className={`bg-slate-900/80 border-2 border-cyan-400/50 backdrop-blur-xl shadow-2xl shadow-cyan-400/10 relative overflow-hidden ${
              isVisible ? "animate-in slide-in-from-bottom-4 duration-1000 delay-500" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Animated Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-transparent to-cyan-400/20 animate-pulse" />

            <CardHeader className="text-center relative z-10 pb-8">
              {/* Bot Icon */}
              <div
                className={`w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center border-2 border-cyan-300/50 shadow-lg transition-all duration-500 ${
                  isConnected
                    ? "shadow-cyan-400/50"
                    : pulseAnimation
                      ? "shadow-cyan-400/30 scale-105"
                      : "shadow-cyan-400/20 scale-100"
                }`}
              >
                {isConnected ? (
                  <CheckCircle className="w-14 h-14 text-slate-900" />
                ) : (
                  <Bot className="w-14 h-14 text-slate-900" />
                )}

                {/* Status Indicator */}
                <div
                  className={`absolute -top-2 -right-2 w-8 h-8 rounded-full border-2 border-slate-900 flex items-center justify-center transition-colors duration-300 ${
                    isConnected ? "bg-cyan-400" : "bg-slate-600"
                  }`}
                >
                  {isConnected ? (
                    <Wifi className="w-4 h-4 text-slate-900" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-slate-300" />
                  )}
                </div>
              </div>

              {/* Status Text */}
              <h3 className="text-2xl font-bold text-white font-mono tracking-wide mb-4">
                {isConnected ? "CONNECTION ESTABLISHED" : "AUTHORIZATION REQUIRED"}
              </h3>

              <Badge
                variant="outline"
                className={`font-mono text-sm px-4 py-2 ${
                  isConnected
                    ? "border-cyan-400 text-cyan-400 bg-cyan-400/10"
                    : "border-slate-600 text-slate-400 bg-slate-600/10"
                }`}
              >
                {isConnected ? "CONNECTED" : "DISCONNECTED"}
              </Badge>
            </CardHeader>

            <CardContent className="space-y-8 relative z-10">
              {!isConnected && (
                <>
                  {/* Permissions Section */}
                  <div className="space-y-6">
                    <h4 className="text-cyan-400 font-mono text-lg tracking-wide text-center">
                      [REQUESTED PERMISSIONS]
                    </h4>
                    <div className="grid gap-4">
                      {permissions.map((permission, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-all duration-300 group"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl flex items-center justify-center border border-cyan-400/30 group-hover:border-cyan-400/50 transition-colors duration-300">
                              <permission.icon className="w-6 h-6 text-cyan-400" />
                            </div>
                            <div>
                              <span className="text-white font-mono text-sm font-bold">{permission.name}</span>
                              <p className="text-slate-400 font-mono text-xs mt-1">{permission.description}</p>
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className={`font-mono text-xs px-3 py-1 ${
                              permission.required
                                ? "border-red-400 text-red-400 bg-red-400/10"
                                : "border-slate-500 text-slate-400 bg-slate-500/10"
                            }`}
                          >
                            {permission.required ? "REQUIRED" : "OPTIONAL"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-3">
                      <Shield className="w-5 h-5 text-cyan-400" />
                      <span className="text-cyan-300 font-mono text-sm font-bold">SECURITY GUARANTEE</span>
                    </div>
                    <p className="text-cyan-300 font-mono text-sm leading-relaxed">
                      JobSync will only use these permissions to provide job posting functionality. Your server data
                      remains secure and private. We never store or share your messages.
                    </p>
                  </div>
                </>
              )}

              {/* Success State */}
              {isConnected && (
                <div className="text-center space-y-8">
                  <div className="bg-cyan-400/10 border border-cyan-400/30 rounded-xl p-8">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                      <CheckCircle className="w-8 h-8 text-cyan-400" />
                      <p className="text-cyan-300 font-mono text-xl font-bold">CONNECTION SUCCESSFUL</p>
                    </div>
                    <p className="text-cyan-400 font-mono text-sm">
                      JobSync is now active in your server and ready to start posting job opportunities
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <Button className="bg-slate-700 hover:bg-slate-600 text-white font-mono border-2 border-slate-600 hover:border-slate-500 transition-all duration-300 py-3">
                      OPEN DASHBOARD
                    </Button>
                    <Button
                      variant="outline"
                      className="border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 font-mono bg-transparent py-3"
                    >
                      VIEW COMMANDS
                    </Button>
                  </div>
                </div>
              )}

              {/* Connect Button */}
              {!isConnected && (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono font-bold py-4 text-base border-2 border-cyan-400 shadow-lg hover:shadow-cyan-400/50 transition-all duration-300 transform hover:scale-105 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {isConnecting ? (
                    <div className="flex items-center space-x-3 relative z-10">
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>CONNECTING TO DISCORD...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 relative z-10">
                      <ExternalLink className="w-5 h-5" />
                      <span>AUTHORIZE WITH DISCORD</span>
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              )}

              {/* Footer Text */}
              <p className="text-center text-slate-400 font-mono text-xs">
                Powered by Discord OAuth 2.0 • Secure & Encrypted • GDPR Compliant
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
