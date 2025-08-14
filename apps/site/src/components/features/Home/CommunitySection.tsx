"use client";

import React from "react";
import { Users, Star } from "lucide-react";

export const CommunitySection: React.FC = () => {
  const communityItems = [
    {
      title: "Realtime Whiteboard",
      tags: ["WebRTC", "tRPC", "Next.js"],
      stars: 142,
    },
    {
      title: "Rust Image Pipeline",
      tags: ["Rust", "WASM", "S3"],
      stars: 98,
    },
    {
      title: "LLM Docs Agent",
      tags: ["Python", "OpenAI"],
      stars: 210,
    },
  ];

  return (
    <section id="community" className="mx-auto max-w-[1440px] px-6 py-16">
      <div className="rounded-2xl border border-border/25 bg-card/60 backdrop-blur-xl p-8 relative shadow-lg hover:shadow-xl transition-all duration-500 group">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5 text-primary">
            <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <div className="text-sm font-semibold">Community Showcase</div>
          </div>
          <span className="text-xs bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-3 py-1.5 rounded-lg border border-yellow-500/30 font-medium shadow-sm backdrop-blur-sm">
            Coming Soon
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 relative">
          {/* Overlay to indicate coming soon */}
          <div className="absolute inset-0 bg-black/50 dark:bg-black/60 backdrop-blur-sm rounded-xl z-10 flex items-center justify-center transition-all duration-300">
            <div className="text-center p-6">
              <div className="text-xl font-bold text-white mb-2">
                Coming Soon
              </div>
              <p className="text-sm text-white/90 leading-relaxed max-w-xs">
                Community showcase featuring the best projects from our members
              </p>
            </div>
          </div>

          {communityItems.map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/25 bg-background/60 p-5 hover:bg-background/80 transition-all duration-300 text-left focus:outline-none focus:ring-2 focus:ring-primary/30 opacity-60 shadow-sm backdrop-blur-sm group/item"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="font-semibold text-sm text-foreground">
                  {item.title}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  {item.stars}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs rounded-md bg-primary/8 text-primary border border-primary/20 px-2 py-1 font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
