"use client";

import * as React from "react";
import { INTRO_EDITORIAL_SCRAMBLE } from "@/lib/intro-scramble";
import { buildEditorialFrame } from "@/lib/intro-locale-wave";
import { cn } from "@/lib/utils";

export type EditorialLocaleScrambleProps = {
  target: string;
  source?: string;
  active: boolean;
  runKey: number;
  staggerMs?: number;
  /** Duração base (s); o tempo total soma `perCharPadSec` por carácter extra. */
  duration?: number;
  perCharPadSec?: number;
  waveWidth?: number;
  characterSet?: string;
  easeExponent?: number;
  className?: string;
  onScrambleComplete?: () => void;
};

function EditorialLocaleScrambleInner({
  target,
  source,
  active,
  runKey,
  staggerMs = 0,
  duration = INTRO_EDITORIAL_SCRAMBLE.duration,
  perCharPadSec = INTRO_EDITORIAL_SCRAMBLE.perCharPadSec,
  waveWidth = INTRO_EDITORIAL_SCRAMBLE.waveWidth,
  characterSet = INTRO_EDITORIAL_SCRAMBLE.characterSet,
  easeExponent = INTRO_EDITORIAL_SCRAMBLE.easeExponent,
  className,
  onScrambleComplete,
}: EditorialLocaleScrambleProps) {
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const targetRef = React.useRef(target);
  const sourceRef = React.useRef(source);
  const onDoneRef = React.useRef(onScrambleComplete);

  targetRef.current = target;
  sourceRef.current = source;
  onDoneRef.current = onScrambleComplete;

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  React.useLayoutEffect(() => {
    const el = spanRef.current;
    if (!el) return;
    if (!active || reduceMotion) {
      el.textContent = target;
      return;
    }
    const src = source;
    if (src !== undefined && src.length > 0 && src !== target) {
      el.textContent = src;
    } else {
      el.textContent = target;
    }
  }, [active, target, source, reduceMotion, runKey]);

  React.useEffect(() => {
    const el = spanRef.current;
    if (!el) return;

    if (!active || reduceMotion) {
      el.textContent = targetRef.current;
      return;
    }

    const tgt = targetRef.current;
    const src = sourceRef.current;
    const crossfade =
      src !== undefined && src.length > 0 && src !== tgt;

    if (!crossfade) {
      el.textContent = tgt;
      return;
    }

    const maxLen = Math.max(tgt.length, src.length);
    const totalSec =
      duration + Math.max(0, maxLen - 1) * perCharPadSec;
    const totalMs = Math.max(120, totalSec * 1000);

    let rafId = 0;
    let timeoutId: number | null = null;
    let cancelled = false;
    let startTime = 0;

    const tick = (now: number) => {
      if (cancelled) return;
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / totalMs);
      const frame = buildEditorialFrame(
        progress,
        tgt,
        src,
        characterSet,
        easeExponent,
        waveWidth,
      );
      if (el.textContent !== frame) {
        el.textContent = frame;
      }
      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        el.textContent = tgt;
        onDoneRef.current?.();
      }
    };

    const begin = (now: number) => {
      if (cancelled) return;
      el.textContent = src;
      startTime = now;
      rafId = requestAnimationFrame(tick);
    };

    const delay = Math.max(0, staggerMs);
    if (delay > 0) {
      timeoutId = window.setTimeout(() => {
        requestAnimationFrame(begin);
      }, delay);
    } else {
      requestAnimationFrame(begin);
    }

    return () => {
      cancelled = true;
      if (timeoutId != null) {
        window.clearTimeout(timeoutId);
      }
      cancelAnimationFrame(rafId);
    };
  }, [
    active,
    runKey,
    staggerMs,
    duration,
    perCharPadSec,
    waveWidth,
    characterSet,
    easeExponent,
    reduceMotion,
    target,
    source,
  ]);

  return (
    <span
      ref={spanRef}
      className={cn(
        "inline-block min-h-[1lh] max-w-full whitespace-pre-wrap align-baseline",
        className,
      )}
    />
  );
}

function editorialPropsEqual(
  a: EditorialLocaleScrambleProps,
  b: EditorialLocaleScrambleProps,
): boolean {
  return (
    a.target === b.target &&
    a.source === b.source &&
    a.active === b.active &&
    a.runKey === b.runKey &&
    a.staggerMs === b.staggerMs &&
    a.duration === b.duration &&
    a.perCharPadSec === b.perCharPadSec &&
    a.waveWidth === b.waveWidth &&
    a.characterSet === b.characterSet &&
    a.easeExponent === b.easeExponent &&
    a.className === b.className
  );
}

export const EditorialLocaleScramble = React.memo(
  EditorialLocaleScrambleInner,
  editorialPropsEqual,
);
