import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { ParticleBackground } from "../components/ui/ParticleBackground";
import { SlotText } from "../components/ui/SlotText";
import { SlotLever } from "../components/ui/SlotLever";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [trigger, setTrigger] = useState(0);

  const { login, isLoading, error } = useAuthStore();
  const urlError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ email, password });
      navigate("/chat");
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Side - Slot Machine Text */}
        <div className="hidden lg:flex flex-row items-center gap-8 pr-8">
          <div className="flex flex-col justify-center space-y-6 flex-1 min-w-0">
            <SlotText
              text="Welcome back"
              trigger={trigger}
              className="text-6xl xl:text-7xl font-bold text-white tracking-tight leading-tight"
              initialDelay={0}
            />

            <SlotText
              text="Sign in to access your AI assistant"
              trigger={trigger}
              className="text-xl text-gray-300 font-light"
              initialDelay={1500}
            />
          </div>
          <div className="flex-shrink-0 pt-4">
            <SlotLever
              onPull={() => setTrigger((t) => t + 1)}
              className="scale-110"
            />
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          {/* Mobile Header (visible only on small screens) */}
          <div className="lg:hidden text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-sm text-gray-300">
              Sign in to access your AI assistant
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-white/10 ring-1 ring-white/5">
            {(error || urlError) && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {error ||
                  (urlError === "access_denied"
                    ? "Access denied"
                    : "Authentication failed")}
              </div>
            )}

            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Input
                    label="Email address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-white/10 rounded-lg transition-all hover:bg-black/50"
                    labelClassName="text-zinc-300"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-zinc-300">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-white/10 rounded-lg transition-all hover:bg-black/50"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-white text-black hover:bg-zinc-200 transition-all font-semibold rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
                  isLoading={isLoading}
                >
                  Sign in
                </Button>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-white hover:text-blue-300 transition-colors underline decoration-zinc-700 hover:decoration-white underline-offset-4"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
