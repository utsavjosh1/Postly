'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Upload, Wand2, GitBranch } from 'lucide-react';
import { localStorage, extractTags } from '@/lib/utils';
import type { ProjectItem } from '@/types';

export const ResumeUpload: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const [text, setText] = useState(() => localStorage.get('resumeText', ''));
  const [tags, setTags] = useState<string[]>(() => extractTags(localStorage.get('resumeText', '')));
  const [privacy, setPrivacy] = useState(() => localStorage.get('privacy', true));

  useEffect(() => { 
    localStorage.set('resumeText', text); 
  }, [text]);
  
  useEffect(() => { 
    localStorage.set('privacy', privacy); 
  }, [privacy]);

  const demoParse = () => {
    setRunning(true);
    const sequence = [
      'postly> upload Resume.pdf … done',
      'postly> parsing projects … 3 repos detected',
      'postly> skills: React · Rust · AWS',
      'postly> impact: 100k+ MAU · P95 -40%',
      'postly> matches ready: Senior Frontend · Platform',
    ];
    setLogs([]);
    sequence.forEach((line, i) => 
      setTimeout(() => setLogs(prev => [...prev, line]), 300 * (i + 1))
    );
    setTimeout(() => setRunning(false), 300 * (sequence.length + 1));
  };

  const handleAnalyze = () => {
    const extractedTags = extractTags(text);
    setTags(extractedTags);
    setLogs(prev => [...prev, `postly> extracted ${extractedTags.length} tags`]);
  };

  const handleUseExample = () => {
    const exampleText = 'Built realtime chat (Next.js, Redis). Reduced P95 by 40%. Rust image pipeline on AWS S3.';
    setText(exampleText);
    handleAnalyze();
  };

  const handleClear = () => {
    setText('');
    setTags([]);
  };

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-12 lg:py-16">
      <div className="grid lg:grid-cols-[1.1fr_1fr] gap-10 items-start">
        <div className="rounded-2xl border border-border bg-white/[0.05] backdrop-blur-xl p-6 relative overflow-hidden retro-terminal">
          <div className="absolute inset-0 opacity-40 terminal-scanlines" />
          <div className="text-sm text-muted-foreground">Parser Lab</div>
          <div className="mt-4 rounded-xl border border-border bg-black/40 p-4 font-mono text-sm min-h-[200px]">
            {logs.map((line, i) => (
              <div 
                key={i} 
                className="animate-slide-up" 
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {line}
              </div>
            ))}
            {running && <div className="text-primary mt-1">▌</div>}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button 
              onClick={demoParse} 
              className="h-10 px-4 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 transition"
            >
              Try Demo Parse
            </button>
            <button 
              onClick={handleAnalyze}
              className="h-10 px-4 rounded-md border border-border hover:bg-white/5"
            >
              Analyze Text
            </button>
            <label className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
              <input 
                type="checkbox" 
                checked={privacy} 
                onChange={(e) => setPrivacy(e.target.checked)} 
                className="accent-current" 
              /> 
              Private by default
            </label>
          </div>
        </div>

        <div className="grid gap-6">
          <div id="upload" className="rounded-2xl border border-border bg-white/[0.05] backdrop-blur-xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Paste Resume / Notes</div>
              <Upload className="w-4 h-4 text-primary" />
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your resume text here. Include projects, stacks, and outcomes."
              className="mt-3 w-full h-40 rounded-md bg-black/20 border border-input p-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
            <div className="mt-3 flex gap-2">
              <button 
                onClick={handleAnalyze} 
                className="h-10 px-4 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 transition"
              >
                Extract Skills
              </button>
              <button 
                onClick={handleUseExample}
                className="h-10 px-4 rounded-md border border-border hover:bg-white/5"
              >
                Use Example
              </button>
              <button 
                onClick={handleClear} 
                className="h-10 px-4 rounded-md border border-border hover:bg-white/5"
              >
                Clear
              </button>
            </div>
          </div>

          <Panel title="Detected Tags" icon={<Wand2 className="w-4 h-4 text-primary" />}>
            {tags.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No tags yet. Paste text and click Extract Skills.
              </div>
            ) : (
              <TagRow tags={tags} />
            )}
          </Panel>

          <Panel title="Projects" icon={<GitBranch className="w-4 h-4 text-primary" />}>
            <CardList items={[
              { name: 'Realtime Chat', meta: '10k DAU • P95 -40%', tags: ['Next.js','WebSocket','Redis'] },
              { name: 'Image Pipeline', meta: '30% cost down', tags: ['Rust','WASM','S3'] },
            ]} />
          </Panel>

          <div className="flex items-center gap-3">
            <button className="h-10 px-4 rounded-md bg-white/10 border border-white/20 hover:bg-white/20 transition">
              See Matches
            </button>
            <Link href="/explore">
              <button className="h-10 px-4 rounded-md border border-border hover:bg-white/5">
                Explore Jobs
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const Panel: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ 
  title, 
  icon, 
  children 
}) => {
  return (
    <div className="rounded-2xl border border-border bg-white/[0.05] backdrop-blur-xl p-5">
      <div className="flex items-center gap-2">
        {icon}
        <div className="text-sm font-medium">{title}</div>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
};

const TagRow: React.FC<{ tags: string[] }> = ({ tags }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map(tag => (
        <span 
          key={tag} 
          className="text-xs rounded-full border border-border bg-secondary px-3 py-1 hover:bg-white/10 cursor-default"
        >
          {tag}
        </span>
      ))}
    </div>
  );
};

const CardList: React.FC<{ items: ProjectItem[] }> = ({ items }) => {
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {items.map(item => (
        <div 
          key={item.name} 
          className="rounded-xl border border-border bg-popover p-4 hover:bg-white/[0.06] transition"
        >
          <div className="flex items-center justify-between">
            <div className="font-medium">{item.name}</div>
            <span className="text-xs text-muted-foreground">{item.meta}</span>
          </div>
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
        </div>
      ))}
    </div>
  );
};
