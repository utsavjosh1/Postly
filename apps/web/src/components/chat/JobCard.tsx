import { Building2, MapPin, DollarSign, ArrowRight, Star } from "lucide-react";

interface JobData {
  id: string | number;
  title: string;
  company: string;
  location: string;
  salary: string;
  match_score?: number;
  is_hot?: boolean;
  tags?: string[];
  highlights?: string[];
  logo_url?: string;
}

interface JobCardProps {
  job: JobData;
  onApply?: (id: string | number) => void;
}

export function JobCard({ job, onApply }: JobCardProps) {
  return (
    <div className="min-w-[280px] w-[280px] bg-zinc-900/50 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all flex flex-col h-full group">
      {/* Header */}
      <div className="p-4 flex gap-3 items-start relative">
        <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5">
          {job.logo_url && job.logo_url !== "placeholder.png" ? (
            <img
              src={job.logo_url}
              alt={job.company}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Building2 className="w-5 h-5 text-zinc-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate" title={job.title}>
            {job.title}
          </h3>
          <p className="text-sm text-zinc-400 truncate">{job.company}</p>
        </div>
        {job.match_score && (
          <div className="absolute top-4 right-4 flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full border border-emerald-400/20">
            <Star className="w-3 h-3 fill-current" />
            {job.match_score}%
          </div>
        )}
      </div>

      {/* Details */}
      <div className="px-4 pb-2 space-y-2 text-sm text-zinc-300">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
          <span className="truncate">{job.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
          <span className="truncate">{job.salary}</span>
        </div>
      </div>

      {/* Tags */}
      {job.tags && job.tags.length > 0 && (
        <div className="px-4 py-2 flex flex-wrap gap-1.5 min-h-[40px]">
          {job.tags.slice(0, 3).map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/5 text-zinc-400 whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
          {job.tags.length > 3 && (
            <span className="px-2 py-0.5 rounded text-[10px] bg-white/5 border border-white/5 text-zinc-500">
              +{job.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Highlights */}
      {job.highlights && job.highlights.length > 0 && (
        <div className="px-4 py-2 bg-white/5 text-xs text-zinc-400">
          <p className="line-clamp-2">“{job.highlights[0]}”</p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-white/5">
        <button
          onClick={() => onApply?.(job.id)}
          className="w-full py-2 bg-white text-black font-medium rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          View & Apply
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
