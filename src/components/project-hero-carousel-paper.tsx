"use client";

import * as React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { ProjectCarouselSlide } from "@/lib/portfolio-project";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";

type Props = {
  slides: ProjectCarouselSlide[];
  className?: string;
};

const TARGET_SLIDE_W = 600;
const TARGET_SLIDE_H = 400;
const GAP_PX = 12;

/**
 * Faixa horizontal de fotos: `overflow-visible` para mostrar a seguinte à direita
 * (e anteriores à esquerda ao avançar). Troca só por setas — `translateX`, sem scrollbar.
 */
export function ProjectHeroCarouselPaper({ slides, className }: Props) {
  const { dictionary } = useLanguage();
  const valid = slides.filter((s) => s.url.trim().length > 0);
  const n = valid.length;

  const measureRef = React.useRef<HTMLDivElement>(null);
  const [slideW, setSlideW] = React.useState(TARGET_SLIDE_W);
  const [index, setIndex] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  React.useEffect(() => {
    setIndex((i) => (n <= 0 ? 0 : Math.min(i, n - 1)));
  }, [n]);

  const measure = React.useCallback(() => {
    const el = measureRef.current;
    if (!el) return;
    const w = el.getBoundingClientRect().width;
    setSlideW(Math.min(TARGET_SLIDE_W, Math.max(280, w)));
  }, []);

  React.useLayoutEffect(() => {
    measure();
  }, [measure, n]);

  React.useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  const canPrev = n > 0 && index > 0;
  const canNext = n > 0 && index < n - 1;

  const go = React.useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => {
        const next = i + dir;
        if (next < 0 || next >= n) return i;
        return next;
      });
    },
    [n],
  );

  const swallowHorizontalWheel = React.useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
    },
    [],
  );

  if (n === 0) return null;

  const slideH = Math.round(slideW * (TARGET_SLIDE_H / TARGET_SLIDE_W));
  const offsetPx = index * (slideW + GAP_PX);

  return (
    <div
      ref={measureRef}
      className={cn(
        "w-full min-w-0 overflow-visible overscroll-x-contain touch-pan-y",
        className,
      )}
      onWheel={swallowHorizontalWheel}
    >
      <div
        className={cn(
          "flex w-max max-w-none",
          !reducedMotion && "transition-transform duration-300 ease-[cubic-bezier(0.33,1,0.68,1)]",
        )}
        style={{
          gap: GAP_PX,
          transform: `translate3d(${-offsetPx}px, 0, 0)`,
          willChange: reducedMotion ? undefined : "transform",
        }}
      >
        {valid.map((s, i) => (
          <div
            key={`${s.url}-${i}`}
            className="shrink-0 overflow-hidden bg-muted"
            style={{ width: slideW, height: slideH }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={s.url}
              alt={s.alt ?? ""}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {n > 1 ? (
        <div
          className={cn(
            "mt-[24px] flex w-full max-w-[600px] items-center justify-start gap-2",
          )}
        >
          <button
            type="button"
            aria-label={dictionary.carouselPrevious}
            disabled={!canPrev}
            onClick={() => go(-1)}
            className={cn(
              "flex items-center justify-center gap-0 px-1.5 py-1",
              "outline outline-1 outline-offset-0 outline-border transition-opacity",
              !canPrev && "opacity-50",
            )}
          >
            <CaretLeft
              className="size-4 shrink-0 text-muted-foreground"
              weight="regular"
              aria-hidden
            />
          </button>
          <button
            type="button"
            aria-label={dictionary.carouselNext}
            disabled={!canNext}
            onClick={() => go(1)}
            className={cn(
              "flex items-center justify-center gap-0 px-1.5 py-1",
              "outline outline-1 outline-offset-0 outline-border transition-opacity",
              !canNext && "opacity-50",
            )}
          >
            <CaretRight
              className="size-4 shrink-0 text-foreground"
              weight="regular"
              aria-hidden
            />
          </button>
        </div>
      ) : null}
    </div>
  );
}
