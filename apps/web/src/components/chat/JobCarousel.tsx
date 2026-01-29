import { JobCard } from "./JobCard";
import { ChevronRight } from "lucide-react";

interface JobCarouselProps {
  message: string;
  data: any[];
  suggested_actions?: string[];
  onApply?: (id: string | number) => void;
}

export function JobCarousel({
  message,
  data,
  suggested_actions,
  onApply,
}: JobCarouselProps) {
  return (
    <div className="w-full space-y-4">
      {message && <p className="text-zinc-100">{message}</p>}

      {/* Scroll Container */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent snap-x">
        {data.map((job) => (
          <div key={job.id} className="snap-center">
            <JobCard job={job} onApply={onApply} />
          </div>
        ))}
      </div>

      {/* Actions */}
      {suggested_actions && suggested_actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {suggested_actions.map((action, i) => (
            <button
              key={i}
              className="px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 text-sm text-zinc-300 transition-colors flex items-center gap-1.5 group"
            >
              {action}
              <ChevronRight className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
