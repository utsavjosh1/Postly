'use client';

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/utils';
import type { FilterProps } from '@/types';

export const FilterMulti: React.FC<FilterProps> = ({ 
  title, 
  options, 
  values, 
  onToggle 
}) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground">{title}</div>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = values.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={cx(
                'text-xs rounded-full border px-3 py-1 transition',
                isActive 
                  ? 'border-border bg-white/10' 
                  : 'border-border bg-secondary hover:bg-white/10'
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
};
