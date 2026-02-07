import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/auth.store";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

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
      await register({ name, email, password, userType });
      navigate("/chat");
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start your journey to finding the perfect job
          </p>
        </div>

        <div className="bg-card py-8 px-6 shadow-lg rounded-xl border border-border">
          {error && (
            <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John Doe"
                className="h-11"
              />

              <Input
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="h-11"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                helperText="Must be at least 8 characters"
                className="h-11"
              />

              <div className="space-y-1.5">
                <label className="text-sm font-medium leading-none text-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUserType("job_seeker")}
                    className={`h-11 rounded-lg border text-sm font-medium transition-all ${
                      userType === "job_seeker"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:border-ring text-muted-foreground"
                    }`}
                  >
                    Job Seeker
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("employer")}
                    className={`h-11 rounded-lg border text-sm font-medium transition-all ${
                      userType === "employer"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-input hover:border-ring text-muted-foreground"
                    }`}
                  >
                    Employer
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base transition-all"
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-medium text-primary hover:text-primary/90 hover:underline transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
