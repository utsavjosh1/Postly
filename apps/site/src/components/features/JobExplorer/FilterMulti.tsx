"use client";

import React from "react";
import { cx } from "@/lib/utils";
import type { FilterProps } from "@/types";

export const FilterMulti: React.FC<FilterProps> = ({
  title,
  options,
  values,
  onToggle,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{title}</label>
        {values.length > 0 && (
          <span className="text-xs text-primary font-medium">
            {values.length} selected
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = values.includes(option);
          const formattedOption = option
            .split("_")
            .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
            .join(" ");

          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={cx(
                "text-sm px-3 py-2 rounded-lg border font-medium transition-all duration-200",
                isActive
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-background/60 backdrop-blur-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:border-border/50",
              )}
            >
              {formattedOption}
            </button>
          );
        })}
      </div>
    </div>
  );
};
