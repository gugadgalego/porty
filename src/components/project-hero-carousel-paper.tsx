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

const GAP_PX = 14;

function trackWidthPx(slideW: number, n: number): number {
  if (n < 1) return 0;
  return n * slideW + (n - 1) * GAP_PX;
}

function minTranslate(viewW: number, slideW: number, n: number): number {
  const tw = trackWidthPx(slideW, n);
  return Math.min(0, viewW - tw);
}

export function ProjectHeroCarouselPaper({ slides, className }: Props) {
  const valid = slides.filter((s) => s.url.trim().length > 0);
  const n = valid.length;

  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [viewW, setViewW] = React.useState(0);
  const [slideW, setSlideW] = React.useState(560);
  const [translate, setTranslate] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);

  const slideH = React.useMemo(
    () => Math.max(200, Math.round(slideW * (2 / 3))),
    [slideW],
  );

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
    const vw = el.clientWidth;
    setViewW(vw);
    const peek = Math.min(56, Math.max(32, Math.round(vw * 0.12)));
    setSlideW(Math.max(260, vw - peek));
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

  const minT =
    viewW > 0 ? minTranslate(viewW, slideW, n) : 0;
  const step = slideW + GAP_PX;

  React.useEffect(() => {
    if (viewW <= 0) return;
    setTranslate((t) => Math.max(minT, Math.min(0, t)));
  }, [minT, viewW, slideW]);

  const goPrev = React.useCallback(() => {
    setTranslate((t) => Math.min(0, t + step));
  }, [step]);

  const goNext = React.useCallback(() => {
    setTranslate((t) => Math.max(minT, t - step));
  }, [minT, step]);

  const prevMuted = translate >= -0.5;
  const nextMuted = translate <= minT + 0.5;
  const trackFits =
    n > 0 && viewW > 0 && trackWidthPx(slideW, n) <= viewW + 0.5;

  const arrowButtonClass = (muted: boolean) =>
    cn(
      "inline-flex size-8 shrink-0 items-center justify-center rounded-none border-0 bg-transparent p-0 shadow-none hover:bg-neutral-100",
      "outline outline-1 -outline-offset-1 outline-neutral-400 transition-[color,outline-color]",
      muted && "outline-neutral-200",
    );

  if (n === 0) return null;

  const transitionMs = reducedMotion ? 0 : 380;
  const transitionStyle =
    transitionMs > 0
      ? `transform ${transitionMs}ms cubic-bezier(0.33, 1, 0.68, 1)`
      : "none";

  return (
    <div className={cn("relative w-full min-w-0", className)}>
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
              className="shrink-0 overflow-hidden border border-neutral-300 bg-neutral-100"
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
      </div>

      {n > 1 ? (
        <div className="mt-3 flex w-full justify-start gap-2">
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
                prevMuted || trackFits ? "text-neutral-400" : "text-stone-950",
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
                nextMuted || trackFits ? "text-neutral-400" : "text-stone-950",
              )}
              weight="regular"
            />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
