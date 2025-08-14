"use client";

import React from "react";

export const AmbientBackground: React.FC = () => {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <div
        className="absolute inset-0 opacity-20 animate-grid-move"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, color-mix(in oklch, var(--primary) 38%, transparent) 1px, transparent 1.2px)",
          backgroundSize: "22px 22px",
          maskImage:
            "radial-gradient(60% 60% at 60% 40%, rgba(0,0,0,1), rgba(0,0,0,0))",
        }}
      />
      <div
        className="absolute -top-32 right-10 h-[28rem] w-[28rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklch, var(--primary) 20%, transparent), transparent)",
        }}
      />
      <div
        className="absolute bottom-[-6rem] left-[-6rem] h-[26rem] w-[26rem] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklch, var(--accent) 18%, transparent), transparent)",
        }}
      />
    </div>
  );
};
