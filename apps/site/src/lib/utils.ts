import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility function for conditional class names
 */
export function cx(...c: (string | false | undefined | null)[]): string {
  return c.filter(Boolean).join(' ');
}

/**
 * Local storage helpers with error handling
 */
export const localStorage = {
  get<T>(key: string, fallback: T): T {
    try {
      const value = window.localStorage.getItem(key);
      return value ? JSON.parse(value) as T : fallback;
    } catch {
      return fallback;
    }
  },
  
  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Silently fail if localStorage is not available
    }
  }
};

/**
 * Extract skills and technologies from text using keyword matching
 */
export function extractTags(text: string): string[] {
  const technologies = [
    'React', 'Rust', 'AWS', 'Kafka', 'Next.js', 'GraphQL', 
    'Postgres', 'Kubernetes', 'WebSocket', 'Redis', 'WASM', 
    'S3', 'Realtime', 'Latency'
  ];
  
  const found = new Set<string>();
  const lowerText = text.toLowerCase();
  
  technologies.forEach(tech => {
    if (lowerText.includes(tech.toLowerCase())) {
      found.add(tech);
    }
  });
  
  // Pattern-based detection
  if (/p95|latency|perf/i.test(text)) found.add('Performance');
  if (/daus?|users|maus?/i.test(text)) found.add('Growth');
  
  return Array.from(found);
}

/**
 * Toggle an item in an array
 */
export function toggleArrayItem<T>(array: T[], item: T): T[] {
  const index = array.indexOf(item);
  if (index === -1) {
    return [...array, item];
  }
  return array.filter((_, i) => i !== index);
}
