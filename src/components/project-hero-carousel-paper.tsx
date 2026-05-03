"use client";

import * as React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import type { ProjectCarouselSlide } from "@/lib/portfolio-project";
import { cn } from "@/lib/utils";

type Props = {
  slides: ProjectCarouselSlide[];
  className?: string;
};

const SLIDE_W = 600;
const SLIDE_H = 400;
const GAP_PX = 20;

function trackWidthPx(n: number): number {
  if (n < 1) return 0;
  return n * SLIDE_W + (n - 1) * GAP_PX;
}

function minTranslate(viewW: number, n: number): number {
  const tw = trackWidthPx(n);
  return Math.min(0, viewW - tw);
}

export function ProjectHeroCarouselPaper({ slides, className }: Props) {
  const valid = slides.filter((s) => s.url.trim().length > 0);
  const n = valid.length;

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [viewW, setViewW] = React.useState(0);
  const [translate, setTranslate] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const on = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const measure = React.useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setViewW(el.clientWidth);
  }, []);

  React.useLayoutEffect(() => {
    measure();
  }, [measure, n]);

  React.useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(el);
    return () => ro.disconnect();
  }, [measure]);

  React.useEffect(() => {
    setTranslate(0);
  }, [n]);

  const minT = viewW > 0 ? minTranslate(viewW, n) : 0;
  const step = SLIDE_W + GAP_PX;

  React.useEffect(() => {
    if (viewW <= 0) return;
    setTranslate((t) => Math.max(minT, Math.min(0, t)));
  }, [minT, viewW]);

  const goPrev = React.useCallback(() => {
    setTranslate((t) => Math.min(0, t + step));
  }, [step]);

  const goNext = React.useCallback(() => {
    setTranslate((t) => Math.max(minT, t - step));
  }, [minT, step]);

  const prevMuted = translate >= -0.5;
  const nextMuted = translate <= minT + 0.5;
  const trackFits = n > 0 && viewW > 0 && trackWidthPx(n) <= viewW + 0.5;

  const arrowButtonClass = (muted: boolean) =>
    cn(
      "size-auto min-h-0 rounded-none border-0 bg-transparent px-1.5 py-1 shadow-none hover:bg-stone-100",
      "outline outline-1 -outline-offset-1 transition-[color,outline-color]",
      muted ? "outline-[#E5E5E5]" : "outline-[#D4D4D4]",
    );

  if (n === 0) return null;

  const transitionMs = reducedMotion ? 0 : 380;
  const transitionStyle =
    transitionMs > 0
      ? `transform ${transitionMs}ms cubic-bezier(0.33, 1, 0.68, 1)`
      : "none";

  return (
    <div
      className={cn(
        "relative ml-[calc(50%-50vw)] w-screen min-w-0 max-w-[100vw]",
        className,
      )}
    >
      <div ref={viewportRef} className="w-full overflow-hidden">
        <div
          className="flex flex-nowrap"
          style={{
            gap: GAP_PX,
            transform: `translate3d(${translate}px,0,0)`,
            transition: transitionStyle,
            willChange: reducedMotion ? undefined : "transform",
          }}
        >
          {valid.map((s, i) => (
            <div
              key={`${s.url}-${i}`}
              className="shrink-0 overflow-hidden rounded-xl border border-stone-200/70 bg-stone-100 dark:border-stone-700/60 dark:bg-stone-900/40"
              style={{ width: SLIDE_W, height: SLIDE_H }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={s.url}
                alt={s.alt ?? ""}
                className="mx-auto block h-full w-full max-h-full max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {n > 1 ? (
        <div className="mx-auto mt-3 flex w-full max-w-[600px] justify-start gap-2 px-4 sm:px-0">
          <Button
            type="button"
            variant="ghost"
            aria-label="Slide anterior"
            disabled={prevMuted || trackFits}
            onClick={goPrev}
            className={arrowButtonClass(prevMuted || trackFits)}
          >
            <CaretLeft
              className={cn(
                "size-4",
                prevMuted || trackFits ? "text-[#78716C]" : "text-[#0C0A09]",
              )}
              weight="regular"
            />
          </Button>
          <Button
            type="button"
            variant="ghost"
            aria-label="Slide seguinte"
            disabled={nextMuted || trackFits}
            onClick={goNext}
            className={arrowButtonClass(nextMuted || trackFits)}
          >
            <CaretRight
              className={cn(
                "size-4",
                nextMuted || trackFits ? "text-[#78716C]" : "text-[#0C0A09]",
              )}
              weight="regular"
            />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
