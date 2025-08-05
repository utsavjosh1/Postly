'use client';

import React from 'react';
import { Users, Star } from 'lucide-react';

export const CommunitySection: React.FC = () => {
  const communityItems = [
    { 
      title: 'Realtime Whiteboard', 
      tags: ['WebRTC','tRPC','Next.js'], 
      stars: 142 
    },
    { 
      title: 'Rust Image Pipeline', 
      tags: ['Rust','WASM','S3'], 
      stars: 98 
    },
    { 
      title: 'LLM Docs Agent', 
      tags: ['Python','OpenAI'], 
      stars: 210 
    },
  ];

  return (
    <section id="community" className="mx-auto max-w-[1440px] px-6 py-12">
      <div className="rounded-2xl border border-border bg-white/[0.05] backdrop-blur-xl p-6 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-4 h-4" />
            <div className="text-sm font-medium">Community</div>
          </div>
          <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full border border-yellow-500/30">
            Coming Soon
          </span>
        </div>
        
        <div className="mt-4 grid sm:grid-cols-3 gap-4 relative">
          {/* Overlay to indicate coming soon */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] rounded-xl z-10 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-medium text-white">Coming Soon</div>
              <p className="text-sm text-white/80 mt-1">Community showcase in development</p>
            </div>
          </div>
          
          {communityItems.map((item, i) => (
            <button 
              key={i} 
              className="rounded-xl border border-border bg-popover p-4 hover:bg-white/[0.06] transition text-left focus:outline-none focus:ring-2 focus:ring-ring/50 opacity-60"
              disabled
            >
              <div className="h-28 rounded-md border border-border bg-secondary/50" />
              <div className="mt-3 text-sm font-medium">{item.title}</div>
              
              <div className="mt-2 flex flex-wrap gap-2">
                {item.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="text-xs rounded-md bg-secondary px-2 py-1 border border-border"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="mt-2 text-xs text-muted-foreground inline-flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-primary" /> {item.stars}
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
