'use client';

import React, { useState } from 'react';
import { 
  LayoutGrid, Table, Plus, Search, Filter, Calendar, Share2 
} from 'lucide-react';
import { cx } from '@/lib/utils';
import { RECRUIT_LANES } from '@/constants';
import type { Candidate, ViewMode } from '@/types';

export const RecruiterDashboard: React.FC = () => {
  const [mode, setMode] = useState<ViewMode>('kanban');
  const [candidates, setCandidates] = useState<Candidate[]>(() =>
    Array.from({ length: 12 }).map((_, i) => ({
      id: i + 1,
      name: ['Aisha K.','Marco R.','Devon T.','Noor L.'][i % 4],
      title: ['Senior Frontend','Platform Engineer','Realtime Eng'][i % 3],
      stack: [['Next.js','GraphQL','Postgres'], ['Rust','Kafka','AWS'], ['React','Node','K8s']][i % 3],
      impact: ['100k+ MAU','P95 -40%','Zero-downtime'][i % 3],
      lane: RECRUIT_LANES[i % RECRUIT_LANES.length],
    }))
  );

  const moveCandidate = (id: number, lane: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, lane } : c));
  };

  return (
    <section className="mx-auto max-w-[1440px] px-6 py-10 lg:py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Recruiter Dashboard</h1>
          <p className="text-muted-foreground">Elegant pipeline manager with AI suggestions.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className={cx(
              'h-10 px-3 rounded-md border border-border text-sm', 
              mode === 'kanban' && 'bg-white/10'
            )} 
            onClick={() => setMode('kanban')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            className={cx(
              'h-10 px-3 rounded-md border border-border text-sm', 
              mode === 'table' && 'bg-white/10'
            )} 
            onClick={() => setMode('table')}
          >
            <Table className="w-4 h-4" />
          </button>
          <button className="h-10 px-3 rounded-md border border-border text-sm hidden sm:inline-flex">
            New Search <Plus className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-white/[0.05] backdrop-blur-xl p-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-black/20 px-3 h-10 text-sm">
            <Search className="w-4 h-4 text-primary" />
            <input 
              placeholder="Stack: Rust, impact > 100k DAU, latency < 50ms" 
              className="bg-transparent outline-none" 
            />
          </div>
          <button className="h-10 px-3 rounded-md border border-border text-sm">
            Filters <Filter className="w-4 h-4 ml-1" />
          </button>
          <button className="h-10 px-3 rounded-md border border-border text-sm">
            Schedule <Calendar className="w-4 h-4 ml-1" />
          </button>
          <button className="h-10 px-3 rounded-md border border-border text-sm">
            Share <Share2 className="w-4 h-4 ml-1" />
          </button>
        </div>

        <div className="mt-6">
          {mode === 'kanban' ? (
            <KanbanView 
              lanes={RECRUIT_LANES as unknown as string[]} 
              items={candidates} 
              onMove={moveCandidate} 
            />
          ) : (
            <TableView items={candidates} />
          )}
        </div>
      </div>
    </section>
  );
};

const KanbanView: React.FC<{
  lanes: string[];
  items: Candidate[];
  onMove: (id: number, lane: string) => void;
}> = ({ lanes, items, onMove }) => {
  const getCandidatesByLane = (lane: string) => items.filter(c => c.lane === lane);
  
  return (
    <div className="grid md:grid-cols-3 xl:grid-cols-5 gap-4">
      {lanes.map(lane => (
        <div key={lane} className="rounded-xl border border-border bg-popover p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">{lane}</div>
            <span className="text-xs text-muted-foreground">
              {getCandidatesByLane(lane).length}
            </span>
          </div>
          <div className="mt-3 grid gap-3">
            {getCandidatesByLane(lane).map(candidate => (
              <div 
                key={candidate.id} 
                className="rounded-lg border border-border bg-white/[0.04] p-3 hover:bg-white/[0.08] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{candidate.name}</div>
                  <span className="text-xs rounded-full border border-border bg-secondary px-2 py-0.5">
                    {candidate.title}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {candidate.stack.map(tech => (
                    <span 
                      key={tech} 
                      className="text-xs rounded-md bg-secondary px-2 py-1 border border-border"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Impact: {candidate.impact}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  {lanes.map(destination => (
                    <button 
                      key={destination} 
                      onClick={() => onMove(candidate.id, destination)} 
                      className={cx(
                        'h-7 px-2 rounded-md border border-border text-[11px] hover:bg-white/5',
                        destination === lane && 'opacity-60 cursor-default'
                      )}
                    >
                      {destination}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const TableView: React.FC<{ items: Candidate[] }> = ({ items }) => {
  const headers = ['Name','Title','Stack','Impact','Lane','Actions'];
  
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-white/[0.04]">
          <tr className="text-left">
            {headers.map(header => (
              <th 
                key={header} 
                className="px-4 py-3 border-b border-border font-medium"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(candidate => (
            <tr 
              key={candidate.id} 
              className="border-b border-border hover:bg-white/[0.04]"
            >
              <td className="px-4 py-3">{candidate.name}</td>
              <td className="px-4 py-3">{candidate.title}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {candidate.stack.map(tech => (
                    <span 
                      key={tech} 
                      className="text-xs rounded-md bg-secondary px-2 py-0.5 border border-border"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </td>
              <td className="px-4 py-3">{candidate.impact}</td>
              <td className="px-4 py-3">{candidate.lane}</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <button className="h-8 px-2 rounded-md border border-border text-xs hover:bg-white/5">
                    Open
                  </button>
                  <button className="h-8 px-2 rounded-md text-xs bg-white/10 border border-white/20">
                    Schedule
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
