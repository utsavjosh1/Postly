'use client';

import React from 'react';

export const GraphView: React.FC = () => {
  const networkNodes = ['Realtime', 'Latency', 'Design Systems', 'Data', 'Infra', 'AI'];

  return (
    <div className="relative h-[520px] rounded-xl border border-border overflow-hidden">
      <div 
        className="absolute inset-0 opacity-30" 
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.25) 1px, transparent 1.2px)',
          backgroundSize: '28px 28px',
        }} 
      />
      
      <div className="absolute inset-0 p-6">
        <div className="text-sm text-muted-foreground">Project Graph</div>
        
        <div className="grid grid-cols-3 gap-6 mt-6">
          {networkNodes.map((node, i) => (
            <div 
              key={node} 
              className="h-28 rounded-xl border border-border bg-white/[0.04] backdrop-blur flex items-center justify-center hover:bg-white/[0.08] transition"
              style={{ 
                animation: `float ${4 + i}s ease-in-out infinite` 
              }}
            >
              <span className="text-sm font-medium text-center px-2">
                {node}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
