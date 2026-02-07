import { useState } from "react";
import { cn } from "../../lib/utils";

interface SlotLeverProps {
  onPull?: () => void;
  className?: string;
}

export function SlotLever({ onPull, className }: SlotLeverProps) {
  const [isPulled, setIsPulled] = useState(false);

  const handleClick = () => {
    if (isPulled) return;

    setIsPulled(true);
    if (onPull) onPull();

    setTimeout(() => {
      setIsPulled(false);
    }, 1000); // Reset after animation
  };

  return (
    <div
      className={cn(
        "relative w-24 h-48 cursor-pointer group select-none flex items-end justify-center",
        className,
      )}
      onClick={handleClick}
      title="Pull to spin!"
    >
      {/* Base Plate */}
      <div className="relative w-24 h-40 bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl overflow-hidden">
        {/* Background Gradient/Texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 to-zinc-900 opacity-90" />

        {/* The deep slot groove */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-28 bg-black rounded-full shadow-[inset_0_2px_10px_rgba(0,0,0,1)] border border-white/5" />
      </div>

      {/* Lever Arm Wrapper - Pivot point is at the bottom of the visible slot area approximately */}
      <div
        className={cn(
          "absolute bottom-16 left-1/2 h-32 w-6 -ml-3 origin-bottom transition-all duration-500 cubic-bezier(0.25, 1, 0.5, 1)", // Springy bounce back
          isPulled
            ? "rotate-[160deg] translate-y-8"
            : "rotate-0 group-hover:rotate-[5deg]",
        )}
      >
        {/* Shaft - Silver/Chrome Gradient */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-full bg-gradient-to-r from-gray-400 via-white to-gray-400 rounded-full shadow-lg border border-gray-400/50" />

        {/* Knob - Shiny Red Ball */}
        <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 w-14 h-14 bg-red-600 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5),inset_-4px_-4px_10px_rgba(0,0,0,0.3)] z-10 border-b border-red-800">
          {/* Specular Highlight */}
          <div className="absolute top-3 left-3 w-5 h-5 bg-gradient-to-br from-white to-transparent rounded-full opacity-80 blur-[1px]" />
          <div className="absolute bottom-3 right-3 w-4 h-4 bg-red-900/50 rounded-full blur-[2px]" />
        </div>
      </div>
    </div>
  );
}
