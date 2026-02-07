import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

interface TextRevealProps {
  text: string;
  altText?: string; // Optional Hindi/Alt text
  className?: string;
  delay?: number; // Launch delay in seconds
}

export function TextReveal({
  text,
  altText,
  className,
  delay = 0,
}: TextRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const words = text.split(" ");
  const altWords = altText ? altText.split(" ") : [];

  // Pad the shorter array to ensure alignment if altText exists
  const outputLength = Math.max(words.length, altWords.length);
  const paddedWords = [...words];
  const paddedAltWords = [...altWords];

  while (paddedWords.length < outputLength) paddedWords.push("");
  while (paddedAltWords.length < outputLength) paddedAltWords.push("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={cn("leading-tight font-medium", className)}>
      {Array.from({ length: outputLength }).map((_, wordIndex) => {
        const primaryWord = words[wordIndex] || "";
        const secondaryWord = altWords[wordIndex] || primaryWord; // Fallback to primary if no alt

        return (
          <span
            key={wordIndex}
            className={cn(
              "inline-block whitespace-nowrap mr-[0.25em] group cursor-default relative top-0 transition-all duration-700 ease-[cubic-bezier(0.2,0.65,0.3,0.9)]",
              isVisible
                ? "opacity-100 translate-y-0 rotate-0"
                : "opacity-0 translate-y-full rotate-3",
            )}
            style={{ transitionDelay: `${delay + wordIndex * 0.1}s` }}
          >
            <span className="relative overflow-hidden inline-block align-bottom h-[1.1em]">
              {/* Primary Word (English) */}
              <span className="block transition-transform duration-500 ease-in-out group-hover:-translate-y-full">
                {primaryWord.split("").map((char, i) => (
                  <span
                    key={i}
                    className="inline-block"
                    style={{ transitionDelay: `${i * 0.02}s` }} // Slight internal stagger
                  >
                    {char}
                  </span>
                ))}
                {/* Ensure space is preserved if empty - trick not needed due to mr-[0.25em] on parent */}
              </span>

              {/* Secondary Word (Hindi/Alt) */}
              <span className="absolute top-0 left-0 block translate-y-full transition-transform duration-500 ease-in-out group-hover:translate-y-0 text-white font-normal w-full text-center">
                {/* Hindi text often doesn't split nicely into chars for slots, usually renders as ligatures. 
                     Better to render the whole word. */}
                {secondaryWord}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
