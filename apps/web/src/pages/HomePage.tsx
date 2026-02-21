import { Link } from "react-router-dom";
import { ParticleBackground } from "../components/ui/ParticleBackground";
import { SlotLever } from "../components/ui/SlotLever";
import { useState } from "react";

const JOB_TITLES = [
  "Frontend Developer",
  "Backend Engineer",
  "Product Manager",
  "UI/UX Designer",
  "DevOps Engineer",
  "Data Scientist",
  "Full Stack Developer",
  "Marketing Manager",
  "Sales Executive",
  "HR Specialist",
];

const COMPANIES = [
  "Google",
  "Meta",
  "Amazon",
  "Netflix",
  "Apple",
  "Microsoft",
  "Stripe",
  "Airbnb",
  "Uber",
  "Spotify",
];

interface JobBox {
  id: number;
  title: string;
  company: string;
  salary: string;
  offsetX: number;
}

export function HomePage() {
  const [boxes, setBoxes] = useState<JobBox[]>([]);
  const [isPulling, setIsPulling] = useState(false);

  const handlePullLever = () => {
    if (isPulling) return;
    setIsPulling(true);

    // Clear existing boxes for a fresh drop stack
    setBoxes([]);

    const newBoxes = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i,
      title: JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)],
      company: COMPANIES[Math.floor(Math.random() * COMPANIES.length)],
      salary: `$${Math.floor(Math.random() * 80 + 80)}k - $${Math.floor(
        Math.random() * 100 + 160,
      )}k`,
      offsetX: Math.floor(Math.random() * 80) - 40,
    }));

    // Tetris-style drop: adding one by one with a setInterval
    let currentIdx = 0;
    const intervalId = setInterval(() => {
      if (currentIdx < newBoxes.length) {
        const boxToAdd = newBoxes[currentIdx];
        // Prepend so the newest job is rendered at the top of the flex-col justify-end container
        setBoxes((prev) => [boxToAdd, ...prev]);
        currentIdx++;
      } else {
        clearInterval(intervalId);
        setIsPulling(false);
      }
    }, 300); // 300ms staggered drop
  };

  return (
    <div className="relative min-h-screen w-full h-full bg-zinc-950 flex flex-col items-center overflow-hidden font-sans">
      <ParticleBackground />

      {/* Pure CSS keyframes for Tetris piece drop without 3rd party libraries */}
      <style>{`
        @keyframes tetris-fall {
          0% {
            transform: translateY(-120vh);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          65% {
            transform: translateY(15px);
          }
          85% {
            transform: translateY(-5px);
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .tetris-piece {
          animation: tetris-fall 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
      `}</style>

      {/* 3-Column Layout to strictly prevent overlaps between Text, Stack, and Lever */}
      <div className="w-full max-w-[1600px] mx-auto min-h-screen h-screen flex flex-col lg:flex-row items-stretch px-4 md:px-8 lg:px-12 relative z-50 pointer-events-none">
        {/* Left Col: Main Subject & Action (Width ~35%) */}
        <div className="flex-1 lg:flex-[1.2] flex flex-col justify-center pointer-events-auto pt-20 lg:pt-0 relative z-50">
          <div className="text-left space-y-8 max-w-xl">
            <h1 className="text-5xl lg:text-7xl font-bold text-white tracking-tight drop-shadow-2xl leading-tight">
              Employment,
              <br />
              simplified.
            </h1>

            <p className="text-xl text-zinc-400 max-w-sm backdrop-blur-sm">
              Postly is a platform that connects job seekers with employers.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4 pt-4">
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
        </div>

        {/* Center Col: The Tetris Box Stack (Width ~40%) */}
        <div className="flex-[1.5] flex flex-col justify-end items-center h-full pointer-events-none relative z-20 pb-4 px-2 overflow-hidden">
          <div className="w-full max-w-[400px] flex flex-col justify-end items-stretch gap-3 pb-8">
            {boxes.map((box) => (
              <div
                key={box.id}
                className="w-full"
                style={{ transform: `translateX(${box.offsetX}px)` }}
              >
                <div className="tetris-piece bg-zinc-900 border border-zinc-700/80 rounded-lg p-5 shadow-2xl flex items-center justify-between pointer-events-auto">
                  <div className="flex flex-col mr-4">
                    <span className="text-white font-semibold text-lg line-clamp-1">
                      {box.title}
                    </span>
                    <span className="text-zinc-400 text-sm">
                      {box.company} • {box.salary}
                    </span>
                  </div>

                  <div className="relative group shrink-0">
                    <button
                      disabled
                      className="px-4 py-2 bg-zinc-800 text-zinc-400 rounded cursor-not-allowed border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
                      title="Please login to apply"
                    >
                      <span className="group-hover:hidden">Apply</span>
                      <span className="hidden group-hover:inline group-hover:text-red-400 text-sm font-medium">
                        Login to apply
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: The Trigger Lever (Width ~25%) */}
        <div className="flex-1 lg:flex-[0.8] flex flex-col justify-center items-end lg:items-center pointer-events-auto relative z-50 pt-12 lg:pt-0">
          <SlotLever
            onPull={handlePullLever}
            className="scale-90 lg:scale-100 origin-center"
          />
        </div>
      </div>
    </div>
  );
}
