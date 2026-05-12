"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { SobreScrollReveal } from "@/components/sobre-scroll-reveal";
import { cn } from "@/lib/utils";

type Props = {
  scrollUnlocked: boolean;
};

export function SobreExperienciaTimeline({ scrollUnlocked }: Props) {
  const { dictionary } = useLanguage();

  return (
    <div className="flex w-full max-w-[600px] flex-col">
      {dictionary.sobreExperienciaEntries.map((entry, i) => (
        <SobreScrollReveal
          key={`${entry.org}-${entry.yearLines.join("-")}`}
          scrollUnlocked={scrollUnlocked}
          revealDelayMs={i * 100}
        >
          <article
            className={cn(
              "grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 py-6 sm:grid-cols-[2.75rem_minmax(0,1fr)]",
              i > 0 && "border-t border-[#0C0A09]/22 dark:border-white/18",
            )}
          >
            <div className="flex flex-col gap-0.5 font-serif text-[14px] font-normal italic leading-tight tracking-tight tabular-nums">
              {entry.yearLines.map((line, lineIndex) => (
                <span
                  key={line}
                  className={
                    lineIndex === 0
                      ? "text-[#0C0A09] dark:text-foreground/90"
                      : "text-foreground/45"
                  }
                >
                  {line}
                </span>
              ))}
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-normal leading-tight tracking-[-0.02em] text-foreground/90">
                {entry.org}
              </h3>
              <p className="mt-2 font-serif text-[14px] font-light leading-relaxed text-foreground/88">
                {entry.body}
              </p>
            </div>
          </article>
        </SobreScrollReveal>
      ))}
    </div>
  );
}
