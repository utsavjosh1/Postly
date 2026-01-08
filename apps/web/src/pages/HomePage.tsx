import { Link } from "react-router-dom";
// import { GradientBackground } from "@components/GradientBackground";

export function HomePage() {
  return (
    <div className="min-h-screen w-full h-full flex flex-col items-center justify-center bg-background">
      {/* <GradientBackground /> */}
      {/* Hero Section */}
      <section className="w-full flex items-center justify-center">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground">
            Find Your Dream Job
          </h1>

          <p className="text-xl text-muted-foreground">
            AI-powered resume matching for perfect opportunities
          </p>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="px-8 py-3 bg-foreground text-background rounded-lg font-semibold hover:opacity-90 transition-all"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 text-foreground border-2 border-border rounded-lg font-semibold hover:bg-muted transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
