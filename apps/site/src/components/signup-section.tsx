"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Bot,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";

export function SignupSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    terms: false,
  });
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Handle success
    }, 2000);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const inputFields = [
    {
      id: "username",
      label: "USERNAME",
      type: "text",
      icon: User,
      placeholder: "Enter your username",
      value: formData.username,
    },
    {
      id: "email",
      label: "EMAIL ADDRESS",
      type: "email",
      icon: Mail,
      placeholder: "Enter your email",
      value: formData.email,
    },
    {
      id: "password",
      label: "PASSWORD",
      type: showPassword ? "text" : "password",
      icon: Lock,
      placeholder: "Create a secure password",
      value: formData.password,
    },
  ];

  return (
    <section
      id="signup"
      ref={sectionRef}
      className="py-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden"
    >
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-md mx-auto">
          <Card
            className={`bg-slate-900/80 border-2 border-cyan-400/50 backdrop-blur-xl shadow-2xl shadow-cyan-400/10 hover:shadow-cyan-400/20 transition-all duration-500 ${
              isVisible
                ? "animate-in slide-in-from-bottom-4 duration-1000"
                : "opacity-0 translate-y-8"
            }`}
          >
            <CardHeader className="text-center pb-8">
              {/* Logo */}
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl flex items-center justify-center border-2 border-cyan-300/50 shadow-lg shadow-cyan-400/30 relative group">
                <Bot className="w-12 h-12 text-slate-900 group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* Title */}
              <h1 className="text-3xl font-bold text-white font-mono tracking-widest mb-3">
                JOIN JOBSYNC
              </h1>
              <p className="text-slate-400 font-mono text-sm">
                Start building your job community today
              </p>
            </CardHeader>

            <CardContent className="space-y-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Form Fields */}
                {inputFields.map((field) => (
                  <div key={field.id} className="space-y-3">
                    <Label
                      htmlFor={field.id}
                      className={`font-mono text-sm tracking-wider transition-colors duration-300 ${
                        focusedField === field.id
                          ? "text-cyan-400"
                          : "text-slate-400"
                      }`}
                    >
                      [{field.label}]
                    </Label>
                    <div className="relative group">
                      <field.icon
                        className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 transition-colors duration-300 ${
                          focusedField === field.id
                            ? "text-cyan-400"
                            : "text-slate-500"
                        }`}
                      />
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={field.value}
                        onChange={(e) =>
                          handleInputChange(field.id, e.target.value)
                        }
                        className={`pl-12 pr-12 py-4 bg-slate-800/50 border-2 text-white font-mono placeholder:text-slate-500 transition-all duration-300 focus:bg-slate-800/80 ${
                          focusedField === field.id
                            ? "border-cyan-400 shadow-lg shadow-cyan-400/20"
                            : "border-slate-600 hover:border-slate-500"
                        }`}
                        onFocus={() => setFocusedField(field.id)}
                        onBlur={() => setFocusedField(null)}
                        required
                      />
                      {/* Password Toggle */}
                      {field.id === "password" && (
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-cyan-400 transition-colors duration-300"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      )}
                      {/* Glow Effect */}
                      <div
                        className={`absolute inset-0 rounded-md bg-cyan-400/10 opacity-0 transition-opacity duration-300 pointer-events-none ${
                          focusedField === field.id ? "opacity-100" : ""
                        }`}
                      />
                    </div>
                  </div>
                ))}

                {/* Terms Checkbox */}
                <div className="flex items-start space-x-3 py-2">
                  <Checkbox
                    id="terms"
                    checked={formData.terms}
                    onCheckedChange={(checked) =>
                      handleInputChange("terms", checked as boolean)
                    }
                    className="border-slate-600 data-[state=checked]:bg-cyan-500 data-[state=checked]:border-cyan-400 transition-colors duration-300 mt-1"
                  />
                  <Label
                    htmlFor="terms"
                    className="text-slate-300 font-mono text-sm leading-relaxed"
                  >
                    I agree to the{" "}
                    <a
                      href="#"
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-cyan-400 hover:text-cyan-300 underline"
                    >
                      Privacy Policy
                    </a>
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading || !formData.terms}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-mono font-bold py-4 text-base border-2 border-cyan-400 shadow-lg hover:shadow-cyan-400/50 transition-all duration-300 transform hover:scale-105 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  {isLoading ? (
                    <div className="flex items-center space-x-3 relative z-10">
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>CREATING ACCOUNT...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3 relative z-10">
                      <Sparkles className="w-5 h-5" />
                      <span>CREATE ACCOUNT</span>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-slate-900 px-4 text-slate-400 font-mono">
                    OR
                  </span>
                </div>
              </div>

              {/* Discord OAuth */}
              <Button
                variant="outline"
                className="w-full border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:border-slate-500 font-mono py-4 text-base bg-transparent transition-all duration-300 transform hover:scale-105"
              >
                <Bot className="w-5 h-5 mr-3" />
                CONTINUE WITH DISCORD
              </Button>

              {/* Login Link */}
              <p className="text-center text-slate-400 font-mono text-sm">
                Already have an account?{" "}
                <a
                  href="#"
                  className="text-cyan-400 hover:text-cyan-300 underline transition-colors duration-300"
                >
                  LOGIN HERE
                </a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
