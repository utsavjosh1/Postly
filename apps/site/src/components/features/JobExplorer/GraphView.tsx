"use client";

import React, { useState, useEffect } from "react";
import { Layers, Network, Zap, Database, Code, Brain } from "lucide-react";

interface Node {
  id: string;
  name: string;
  category: string;
  connections: number;
  x: number;
  y: number;
  icon: React.ReactNode;
  color: string;
}

interface Connection {
  from: string;
  to: string;
  strength: number;
}

export const GraphView: React.FC = () => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [animationOffset, setAnimationOffset] = useState(0);

  const nodes: Node[] = [
    {
      id: "frontend",
      name: "Frontend",
      category: "UI/UX",
      connections: 24,
      x: 20,
      y: 30,
      icon: <Code className="w-5 h-5" />,
      color: "rgb(59, 130, 246)" // blue
    },
    {
      id: "backend",
      name: "Backend",
      category: "Server",
      connections: 18,
      x: 80,
      y: 25,
      icon: <Database className="w-5 h-5" />,
      color: "rgb(34, 197, 94)" // green
    },
    {
      id: "fullstack",
      name: "Full Stack",
      category: "Development",
      connections: 32,
      x: 50,
      y: 50,
      icon: <Layers className="w-5 h-5" />,
      color: "rgb(168, 85, 247)" // purple
    },
    {
      id: "devops",
      name: "DevOps",
      category: "Infrastructure",
      connections: 15,
      x: 75,
      y: 70,
      icon: <Network className="w-5 h-5" />,
      color: "rgb(245, 101, 101)" // red
    },
    {
      id: "ai",
      name: "AI/ML",
      category: "Machine Learning",
      connections: 21,
      x: 25,
      y: 75,
      icon: <Brain className="w-5 h-5" />,
      color: "rgb(249, 115, 22)" // orange
    },
    {
      id: "mobile",
      name: "Mobile Dev",
      category: "Mobile",
      connections: 19,
      x: 15,
      y: 50,
      icon: <Zap className="w-5 h-5" />,
      color: "rgb(14, 165, 233)" // sky
    }
  ];

  const connections: Connection[] = [
    { from: "frontend", to: "fullstack", strength: 0.9 },
    { from: "backend", to: "fullstack", strength: 0.9 },
    { from: "fullstack", to: "devops", strength: 0.7 },
    { from: "backend", to: "devops", strength: 0.8 },
    { from: "ai", to: "backend", strength: 0.6 },
    { from: "mobile", to: "frontend", strength: 0.7 },
    { from: "mobile", to: "fullstack", strength: 0.5 },
    { from: "ai", to: "fullstack", strength: 0.4 }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationOffset(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const getNodeById = (id: string) => nodes.find(node => node.id === id);

  return (
    <div className="relative h-[600px] rounded-xl border border-border/60 bg-gradient-to-br from-background/50 to-accent/10 overflow-hidden">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Header */}
      <div className="absolute top-6 left-6 z-10">
        <h3 className="text-lg font-semibold text-foreground mb-1">
          Job Market Network
        </h3>
        <p className="text-sm text-muted-foreground">
          Explore connections between tech roles
        </p>
      </div>

      {/* SVG for connections */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59, 130, 246, 0.3)" />
            <stop offset="100%" stopColor="rgba(168, 85, 247, 0.3)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {connections.map((connection) => {
          const fromNode = getNodeById(connection.from);
          const toNode = getNodeById(connection.to);
          
          if (!fromNode || !toNode) return null;

          const x1 = (fromNode.x / 100) * 600;
          const y1 = (fromNode.y / 100) * 600;
          const x2 = (toNode.x / 100) * 600;
          const y2 = (toNode.y / 100) * 600;

          const isHighlighted = hoveredNode === fromNode.id || hoveredNode === toNode.id;

          return (
            <g key={`${connection.from}-${connection.to}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isHighlighted ? "url(#connectionGradient)" : "rgba(255,255,255,0.1)"}
                strokeWidth={isHighlighted ? 3 : 1}
                strokeDasharray={isHighlighted ? "none" : "5,5"}
                strokeDashoffset={animationOffset}
                className="transition-all duration-300"
                filter={isHighlighted ? "url(#glow)" : "none"}
              />
              
              {/* Connection strength indicator */}
              <circle
                cx={(x1 + x2) / 2}
                cy={(y1 + y2) / 2}
                r={connection.strength * 4}
                fill={isHighlighted ? "rgba(59, 130, 246, 0.5)" : "rgba(255,255,255,0.1)"}
                className="transition-all duration-300"
              />
            </g>
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map((node, index) => (
        <div
          key={node.id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            animation: `float ${4 + index * 0.5}s ease-in-out infinite`,
          }}
          onMouseEnter={() => setHoveredNode(node.id)}
          onMouseLeave={() => setHoveredNode(null)}
        >
          {/* Node circle */}
          <div
            className={`
              w-16 h-16 rounded-full border-2 backdrop-blur-sm flex items-center justify-center
              transition-all duration-300 relative z-10
              ${hoveredNode === node.id 
                ? 'scale-125 shadow-lg' 
                : 'scale-100 group-hover:scale-110'
              }
            `}
            style={{
              backgroundColor: hoveredNode === node.id ? node.color + '20' : 'rgba(255,255,255,0.05)',
              borderColor: hoveredNode === node.id ? node.color : 'rgba(255,255,255,0.2)',
              boxShadow: hoveredNode === node.id ? `0 0 20px ${node.color}40` : 'none'
            }}
          >
            <div
              className="transition-colors duration-300"
              style={{ color: hoveredNode === node.id ? node.color : '#6b7280' }}
            >
              {node.icon}
            </div>
          </div>

          {/* Node label */}
          <div
            className={`
              absolute top-full mt-2 left-1/2 transform -translate-x-1/2
              bg-background/90 backdrop-blur-sm border border-border/60 rounded-lg px-3 py-2
              text-xs font-medium text-foreground whitespace-nowrap shadow-lg
              transition-all duration-300
              ${hoveredNode === node.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
            `}
          >
            <div className="font-semibold">{node.name}</div>
            <div className="text-muted-foreground text-xs">{node.connections} positions</div>
            <div className="text-muted-foreground text-xs">{node.category}</div>
          </div>

          {/* Pulse animation for active nodes */}
          {hoveredNode === node.id && (
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{
                backgroundColor: node.color + '30',
                animationDuration: '2s'
              }}
            />
          )}
        </div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-background/90 backdrop-blur-sm border border-border/60 rounded-lg p-4 space-y-2">
        <div className="text-sm font-medium text-foreground mb-2">Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/30 border border-blue-500"></div>
            <span className="text-muted-foreground">Hover to explore</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 bg-gradient-to-r from-blue-500/30 to-purple-500/30"></div>
            <span className="text-muted-foreground">Role connections</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
          50% { transform: translate(-50%, -50%) translateY(-10px); }
        }
      `}</style>
    </div>
  );
};
