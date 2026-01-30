import { cn } from "../../lib/utils";

interface MatchScoreProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function MatchScore({
  score,
  size = "md",
  showLabel = true,
}: MatchScoreProps) {
  const getColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const sizes = {
    sm: { container: "w-10 h-10", text: "text-xs", stroke: 3 },
    md: { container: "w-14 h-14", text: "text-sm", stroke: 4 },
    lg: { container: "w-20 h-20", text: "text-lg", stroke: 5 },
  };

  const { container, text, stroke } = sizes[size];
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={cn("relative", container)}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/30"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            className={cn("transition-all duration-500", getBgColor(score))}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center font-bold",
            text,
            getColor(score),
          )}
        >
          {score}%
        </span>
      </div>
      {showLabel && (
        <span className="text-xs text-muted-foreground">Match</span>
      )}
    </div>
  );
}
