import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "../services/auth.service";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { ParticleBackground } from "../components/ui/ParticleBackground";
import { ArrowLeft } from "lucide-react";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await authService.forgotPassword(email);
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-12 px-4">
      <ParticleBackground />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-zinc-900/50 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-white/10 ring-1 ring-white/5">
          <div className="mb-8">
            <Link
              to="/login"
              className="inline-flex items-center text-sm text-zinc-400 hover:text-white transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
            <h2 className="text-3xl font-bold text-white mb-2">
              Forgot Password?
            </h2>
            <p className="text-sm text-gray-300">
              Enter your email address to reset your password.
            </p>
          </div>

          {isSuccess ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
              <h3 className="text-green-400 font-semibold mb-2">
                Check your email
              </h3>
              <p className="text-zinc-300 text-sm mb-6">
                We have sent a password reset link to {email}.
              </p>
              <Link to="/login">
                <Button className="w-full bg-white text-black hover:bg-zinc-200">
                  Return to Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
                  {error}
                </div>
              )}

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

              <Button
                type="submit"
                className="w-full h-12 text-base bg-white text-black hover:bg-zinc-200 transition-all font-semibold rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-[1.02]"
                isLoading={isSubmitting}
              >
                Send Reset Link
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
