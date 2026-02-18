import { Link } from "react-router-dom";
import { ParticleBackground } from "../components/ui/ParticleBackground";

export function HomePage() {
  return (
    <div className="relative min-h-screen w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <ParticleBackground />

      <section className="relative z-10 w-full flex items-center justify-center p-4">
        <div className="text-center space-y-8 max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight drop-shadow-2xl">
            Employment, simplified.
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto backdrop-blur-sm">
            Postly is a platform that connects job seekers with employers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              to="/register"
              className="px-8 py-3.5 bg-white text-black text-lg rounded-lg font-semibold hover:bg-zinc-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3.5 text-white border border-white/20 hover:border-white/50 bg-white/5 hover:bg-white/10 rounded-lg text-lg font-semibold transition-all backdrop-blur-md"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
