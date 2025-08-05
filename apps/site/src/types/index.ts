export type Route = 'home' | 'explore' | 'upload' | 'recruiters';

export interface Job {
  id: number;
  company: string;
  title: string;
  comp: string;
  loc: string;
  tags: string[];
  impact: string;
}

export interface Candidate {
  id: number;
  name: string;
  title: string;
  stack: string[];
  impact: string;
  lane: string;
}

export interface NavigationProps {
  onExplore: () => void;
  onUpload: () => void;
}

export interface ProjectItem {
  name: string;
  meta: string;
  tags: string[];
}

export type ViewMode = 'grid' | 'graph' | 'kanban' | 'table';

export interface FilterProps {
  title: string;
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
}
