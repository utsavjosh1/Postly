import { useEffect, useState, useRef, useCallback } from "react";
import { cn } from "../../lib/utils";

interface SlotTextProps {
  text: string;
  trigger: unknown;
  className?: string;
  scrambleSpeed?: number;
  resolveSpeed?: number;
  initialDelay?: number; // Time to scramble before resolving starts
}

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";

export function SlotText({
  text,
  trigger,
  className,
  scrambleSpeed = 40,
  resolveSpeed = 80,
  initialDelay = 1000,
}: SlotTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<number | null>(null);
  const resolveIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  // Track resolved index in a ref to satisfy closure/interval requirements without stale state
  const resolvedIndexRef = useRef(-1);

  const startAnimation = useCallback(() => {
    // Clear existing
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (resolveIntervalRef.current) clearInterval(resolveIntervalRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    resolvedIndexRef.current = -1;

    // Scramble Loop
    intervalRef.current = window.setInterval(() => {
      setDisplayText(() => {
        return text
          .split("")
          .map((char, index) => {
            if (index <= resolvedIndexRef.current) return char;
            if (char === " ") return " ";
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("");
      });
    }, scrambleSpeed);

    // Resolve Sequence
    timeoutRef.current = window.setTimeout(() => {
      resolveIntervalRef.current = window.setInterval(() => {
        resolvedIndexRef.current += 1;

        if (resolvedIndexRef.current >= text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (resolveIntervalRef.current)
            clearInterval(resolveIntervalRef.current);
          setDisplayText(text);
        }
      }, resolveSpeed);
    }, initialDelay);
  }, [text, scrambleSpeed, resolveSpeed, initialDelay]);

  useEffect(() => {
    if (trigger) {
      startAnimation();
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (resolveIntervalRef.current) clearInterval(resolveIntervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [trigger, startAnimation]);

  return (
    <div className={cn("font-medium wrap-break-word", className)}>
      {displayText.split(" ").map((word: string, wordIndex: number) => (
        <span
          key={wordIndex}
          className="inline-block whitespace-nowrap mr-[0.25em]"
        >
          {word.split("").map((char: string, charIndex: number) => (
            <span
              key={charIndex}
              className="inline-block min-w-[0.5em] text-center"
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
