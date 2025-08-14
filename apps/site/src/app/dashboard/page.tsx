"use client";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Bot,
  FileText,
  TrendingUp,
  Users,
  Briefcase,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // console.log("user", user)

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-emerald-400 font-mono">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-slate-950 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back,{" "}
            <span className="text-emerald-400">{user.name || user.email}</span>!
          </h1>
          <p className="text-slate-400 font-mono">
            Ready to discover your next opportunity?
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-mono">APPLICATIONS</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <FileText className="w-8 h-8 text-emerald-400" />
            </div>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-mono">MATCHES</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-400" />
            </div>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-mono">INTERVIEWS</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
              <Users className="w-8 h-8 text-emerald-400" />
            </div>
          </Card>
        </div>

        {/* Beta Notice */}
        <Card className="bg-gradient-to-r from-emerald-900/20 to-blue-900/20 border-emerald-400/30 p-8 mb-8">
          <div className="text-center">
            <Bot className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Welcome to the Beta!
            </h2>
            <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
              You&apos;re among the first to experience our AI-powered job
              discovery platform. Features are being added regularly, and your
              feedback helps shape the future of job hunting.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold"
                disabled
              >
                <Briefcase className="w-4 h-4 mr-2" />
                Browse Jobs (Coming Soon)
              </Button>
              <Button
                variant="outline"
                className="border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-slate-900 font-mono"
                disabled
              >
                <Star className="w-4 h-4 mr-2" />
                Set Preferences (Coming Soon)
              </Button>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-xl font-bold text-white mb-4 font-mono">
              RECENT ACTIVITY
            </h3>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No activity yet</p>
              <p className="text-slate-500 text-sm">
                Your job applications and matches will appear here
              </p>
            </div>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800 p-6">
            <h3 className="text-xl font-bold text-white mb-4 font-mono">
              RECOMMENDED JOBS
            </h3>
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">AI recommendations coming soon</p>
              <p className="text-slate-500 text-sm">
                Our AI will suggest perfect job matches based on your profile
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
