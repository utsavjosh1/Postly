"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  X,
  Mail,
  User,
  MessageCircle,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface BetaSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BetaSignupModal({ isOpen, onClose }: BetaSignupModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    discordUsername: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus("idle");

    try {
      const response = await fetch("/api/beta-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus("success");
        setFormData({ name: "", email: "", discordUsername: "" });
        // Auto close after 3 seconds
        setTimeout(() => {
          onClose();
          setStatus("idle");
        }, 3000);
      } else {
        const data = await response.json();
        setStatus("error");
        setErrorMessage(
          data.message || "Something went wrong. Please try again.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMessage(
        "Network error. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-in fade-in-0 duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border-2 border-emerald-400/30 rounded-2xl p-8 max-w-md w-full shadow-2xl shadow-emerald-400/10 animate-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-emerald-400 transition-colors duration-200 p-1 rounded-lg hover:bg-emerald-400/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg border border-emerald-300/50">
            <Mail className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-2xl font-bold text-emerald-400 font-mono tracking-wider mb-2">
            JOIN BETA ACCESS
          </h2>
          <p className="text-slate-400 font-mono text-sm">
            Get early access to POSTLY when we launch
          </p>
        </div>

        {/* Success State */}
        {status === "success" && (
          <div className="text-center mb-6">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-green-400 font-mono mb-2">
              WELCOME TO THE BETA!
            </h3>
            <p className="text-slate-400 font-mono text-sm">
              You&apos;ll be notified when POSTLY launches. Check your email for
              confirmation.
            </p>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-400/30 rounded-lg">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <p className="font-mono text-sm">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        {status !== "success" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-emerald-400 font-mono text-sm tracking-wider">
                FULL NAME
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="pl-10 bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-400 focus:ring-emerald-400/20"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-emerald-400 font-mono text-sm tracking-wider">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="pl-10 bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-400 focus:ring-emerald-400/20"
                  placeholder="john@example.com"
                  required
                />
              </div>
            </div>

            {/* Discord Username Input */}
            <div className="space-y-2">
              <label className="text-emerald-400 font-mono text-sm tracking-wider">
                DISCORD USERNAME{" "}
                <span className="text-slate-500">(OPTIONAL)</span>
              </label>
              <div className="relative">
                <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  value={formData.discordUsername}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discordUsername: e.target.value,
                    })
                  }
                  className="pl-10 bg-slate-800 border-slate-700 text-white font-mono focus:border-emerald-400 focus:ring-emerald-400/20"
                  placeholder="username#1234"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold py-3 border border-emerald-400 shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "JOINING..." : "JOIN BETA ACCESS"}
            </Button>

            {/* Footer Info */}
            <p className="text-center text-slate-500 font-mono text-xs">
              No spam, just beta updates and launch notifications
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
