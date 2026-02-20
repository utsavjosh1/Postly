import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { ParticleBackground } from "../components/ui/ParticleBackground";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<"job_seeker" | "employer">(
    "job_seeker",
  );
  const navigate = useNavigate();

  const { register, isLoading, error } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register({ full_name: name, email, password, role: userType });
      navigate("/chat");
    } catch {
      // Error is surfaced via useAuthStore's error state
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-12">
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-6xl px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="hidden lg:flex flex-row items-center gap-8 pr-8">
          <div className="flex flex-col justify-center space-y-8 flex-1 min-w-0">
            <h1 className="text-6xl lg:text-7xl font-bold text-white tracking-tight leading-tight">
              Create an account
            </h1>

            <p className="text-xl lg:text-2xl text-gray-300 font-light max-w-lg">
              Start your journey to finding the perfect job
            </p>
          </div>
        </div>

        <div className="w-full max-w-md mx-auto lg:mx-0 lg:ml-auto">
          <div className="lg:hidden text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Create an account
            </h2>
            <p className="text-sm text-gray-300">
              Start your journey to finding the perfect job
            </p>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-white/10 ring-1 ring-white/5">
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Input
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="John Doe"
                    className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-white/10 rounded-lg transition-all hover:bg-black/50"
                    labelClassName="text-zinc-300"
                  />
                </div>

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
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    helperText="Must be at least 8 characters"
                    className="h-12 bg-black/40 border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:ring-white/10 rounded-lg transition-all hover:bg-black/50"
                    labelClassName="text-zinc-300"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium leading-none text-zinc-300">
                    I am a...
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setUserType("job_seeker")}
                      className={`h-12 rounded-lg border text-sm font-medium transition-all ${
                        userType === "job_seeker"
                          ? "border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                          : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5 hover:text-white hover:border-white/30"
                      }`}
                    >
                      Job Seeker
                    </button>
                    <button
                      type="button"
                      disabled={true}
                      onClick={() => setUserType("employer")}
                      className={`h-12 rounded-lg border text-sm font-medium transition-all ${
                        userType === "employer"
                          ? "border-white bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                          : "border-white/10 bg-black/20 text-zinc-400 hover:bg-white/5 hover:text-white hover:border-white/30"
                      }`}
                    >
                      Employer
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base bg-white text-black hover:bg-zinc-200 transition-all font-semibold rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              </form>
            </div>

            <p className="mt-8 text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-white hover:text-blue-300 transition-colors underline decoration-zinc-700 hover:decoration-white underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
