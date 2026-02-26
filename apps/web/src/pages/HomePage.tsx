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
              <a
                href="https://discord.com/oauth2/authorize?client_id=1410945912129454100&permissions=83968&integration_type=0&scope=bot+applications.commands"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3.5 bg-[#5865F2] text-white text-lg rounded-lg font-semibold hover:bg-[#4752C4] hover:scale-105 transition-all shadow-[0_0_20px_rgba(88,101,242,0.3)] flex items-center gap-2"
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152c-.0766.1365-.164.3193-.2235.4594-2.0808-.3107-4.1622-.3107-6.2104 0-.0595-.1401-.1469-.3229-.2235-.4594a19.7366 19.7366 0 00-4.8851 1.5152c-3.1114 4.6467-3.9645 9.1724-3.5414 13.6365.0116.126.0825.2443.1741.3283 2.0527 1.5097 4.0416 2.4228 5.9929 3.0294.0772.0239.1593-.0044.2046-.0715.4624-.6317.8691-1.2957 1.2223-1.9928.0284-.055.006-.1214-.0491-.1446-.6533-.2477-1.2721-.5552-1.8592-.9165-.0587-.0361-.0618-.1206-.0063-.1608.1235-.0901.247-.1846.3629-.2816.0204-.0172.0487-.0216.073-.0112 3.9117 1.7877 8.1622 1.7877 12.0239 0 .0243-.0104.0526-.006.073.0112.1159.097.2393.1914.3629.2816.0555.0402.0524.1247-.0063.1608-.5871.3613-1.2059.6688-1.8592.9165-.0551.0232-.0775.0896-.0491.1446.3532.6971.7599 1.3611 1.2223 1.9928.0453.0671.1274.0954.2046.0715 1.9513-.6066 3.9402-1.5197 5.9929-3.0294.0916-.084.1625-.2023.1741-.3283.5191-5.1504-.8408-9.6373-3.5414-13.6365zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0951 2.1568 2.4189 0 1.3333-.9555 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0951 2.1568 2.4189 0 1.3333-.946 2.419-2.1568 2.419z" />
                </svg>
                Add to Discord
              </a>
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
