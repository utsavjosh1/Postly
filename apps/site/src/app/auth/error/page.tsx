"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AuthErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <Card className="bg-slate-900/50 border-red-400/30 p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-500/20 border border-red-400/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 font-mono">
            AUTHENTICATION FAILED
          </h1>
          <p className="text-slate-400 font-mono text-sm">
            Unable to sign you in with Google. Please try again.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => router.push("/")}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-mono font-bold"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            TRY AGAIN
          </Button>

          <Link href="/">
            <Button
              variant="outline"
              className="w-full bg-slate-800/50 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/20 font-mono"
            >
              <Home className="w-4 h-4 mr-2" />
              BACK TO HOME
            </Button>
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-700">
          <p className="text-xs text-slate-500 font-mono">
            If the problem persists, please contact support.
          </p>
        </div>
      </Card>
    </div>
  );
}
