"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Terminal, Play } from "lucide-react"

export function InteractiveTerminal() {
  const [currentCommand, setCurrentCommand] = useState(0)
  const [displayText, setDisplayText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)

  const commands = [
    {
      input: "add-to-discord --token bot-key",
      output: "✅ Bot added to @JobsHub",
      delay: 80,
    },
    {
      input: "upload resume.pdf",
      output: "✅ Job suggestions sent.",
      delay: 60,
    },
    {
      input: "list-org --pay 499",
      output: "✅ Company profile created!",
      delay: 70,
    },
    {
      input: "scrape-jobs --sources all",
      output: "✅ 1,247 new jobs found",
      delay: 50,
    },
    {
      input: "post-twitter --count 100",
      output: "✅ 100 jobs tweeted successfully",
      delay: 65,
    },
  ]

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
    if (!isVisible) return

    const runCommand = async () => {
      const command = commands[currentCommand]
      setIsTyping(true)
      setDisplayText("")

      // Type the input command
      for (let i = 0; i <= command.input.length; i++) {
        setDisplayText(command.input.slice(0, i))
        await new Promise((resolve) => setTimeout(resolve, command.delay))
      }

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Add output
      setDisplayText(command.input + "\n" + command.output)
      setIsTyping(false)

      // Wait before next command
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Move to next command
      setCurrentCommand((prev) => (prev + 1) % commands.length)
    }

    runCommand()
  }, [currentCommand, isVisible])

  useEffect(() => {
    // Cursor blink
    const interval = setInterval(() => setShowCursor((prev) => !prev), 500)
    return () => clearInterval(interval)
  }, [])

  const clickableCommands = [
    "help --commands",
    "status --server",
    "config --channels",
    "analytics --today",
    "backup --data",
  ]

  return (
    <section
      id="terminal"
      ref={sectionRef}
      className="py-32 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="h-full w-full"
          style={{
            backgroundImage: `
              radial-gradient(circle at 2px 2px, rgba(6, 182, 212, 0.3) 1px, transparent 0)
            `,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div
          className={`text-center mb-16 max-w-4xl mx-auto ${
            isVisible ? "animate-in slide-in-from-bottom-4 duration-1000" : "opacity-0 translate-y-8"
          }`}
        >
          <Badge className="bg-cyan-500/20 text-cyan-400 border border-cyan-400/50 px-6 py-3 font-mono tracking-wider mb-8 text-base">
            <Terminal className="w-4 h-4 mr-2" />
            LIVE TERMINAL
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 font-mono tracking-wide">
            SEE JOBSYNC
            <br />
            <span className="text-cyan-400">IN ACTION</span>
          </h2>
          <p className="text-xl text-slate-400 font-mono leading-relaxed">
            Watch real-time job processing and bot commands in our interactive terminal
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main Terminal */}
          <Card
            className={`bg-slate-900/90 border-2 border-cyan-400/50 backdrop-blur-xl shadow-2xl shadow-cyan-400/10 mb-8 ${
              isVisible ? "animate-in slide-in-from-bottom-4 duration-1000 delay-500" : "opacity-0 translate-y-8"
            }`}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full" />
                    <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                    <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
                  </div>
                  <span className="text-cyan-400 font-mono text-sm">jobsync@terminal</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 font-mono text-xs px-3 py-1">
                  LIVE
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="bg-slate-950/80 rounded-lg p-6 font-mono text-sm">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-cyan-400">$</span>
                  <span className="text-slate-300">
                    {displayText.split("\n")[0]}
                    {isTyping && showCursor && <span className="text-cyan-400 animate-pulse">|</span>}
                  </span>
                </div>
                {displayText.includes("\n") && (
                  <div className="text-emerald-400 ml-4 mb-4">{displayText.split("\n")[1]}</div>
                )}
                <div className="flex items-center space-x-2 text-slate-500">
                  <span className="text-cyan-400">$</span>
                  <span className="animate-pulse">_</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Interactive Commands */}
          <div
            className={`grid md:grid-cols-2 lg:grid-cols-3 gap-4 ${
              isVisible ? "animate-in slide-in-from-bottom-4 duration-1000 delay-1000" : "opacity-0 translate-y-8"
            }`}
          >
            {clickableCommands.map((command, index) => (
              <Card
                key={index}
                className="bg-slate-800/50 border border-slate-700 hover:border-cyan-400/50 transition-all duration-300 cursor-pointer group"
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Play className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
                    <span className="font-mono text-sm text-slate-300 group-hover:text-white transition-colors duration-300">
                      {command}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Terminal Stats */}
          <div
            className={`mt-12 grid md:grid-cols-4 gap-6 ${
              isVisible ? "animate-in slide-in-from-bottom-4 duration-1000 delay-1500" : "opacity-0 translate-y-8"
            }`}
          >
            {[
              { label: "Commands Run", value: "12,847" },
              { label: "Jobs Processed", value: "3,291" },
              { label: "Servers Active", value: "1,847" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-cyan-400 font-mono mb-2">{stat.value}</div>
                <div className="text-slate-400 font-mono text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
