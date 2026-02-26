import React from "react";

export const PageLoader: React.FC = () => {
  return (
    <div className="min-h-[60vh] w-full flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-neutral-500 text-sm font-medium animate-pulse">
        Loading your experience...
      </p>
    </div>
  );
};
