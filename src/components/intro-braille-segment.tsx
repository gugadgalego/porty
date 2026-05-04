"use client";

import * as React from "react";
import { animate, scrambleText, type JSAnimation } from "animejs";

type IntroBrailleSegmentProps = {
  text: string;
  /** Quando true, após `startDelayMs` corre o scramble braille até `text`. */
  active: boolean;
  startDelayMs?: number;
  prefersReducedMotion?: boolean;
  className?: string;
};

export function IntroBrailleSegment({
  text,
  active,
  startDelayMs = 0,
  prefersReducedMotion = false,
  className,
}: IntroBrailleSegmentProps) {
  const visibleRef = React.useRef<HTMLSpanElement>(null);
  const animRef = React.useRef<JSAnimation | null>(null);

  const stopAnim = React.useCallback(() => {
    if (animRef.current) {
      animRef.current.revert();
      animRef.current = null;
    }
  }, []);

  React.useEffect(() => () => stopAnim(), [stopAnim]);

  React.useEffect(() => {
    if (!active) {
      stopAnim();
      const el = visibleRef.current;
      if (el) el.textContent = "";
      return;
    }

    const el = visibleRef.current;
    if (!el) return;

    let startTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const run = () => {
      if (cancelled) return;
      stopAnim();
      if (prefersReducedMotion) {
        el.textContent = text;
        return;
      }
      el.textContent = "";
      animRef.current = animate(el, {
        textContent: scrambleText({
          text,
          chars: "braille",
          from: "left",
          ease: "outQuad",
          revealRate: 48,
          settleDuration: 280,
        }),
        ease: "outQuad",
      });
    };

    if (startDelayMs > 0) {
      startTimer = setTimeout(run, startDelayMs);
    } else {
      run();
    }

    return () => {
      cancelled = true;
      if (startTimer) clearTimeout(startTimer);
      stopAnim();
      if (visibleRef.current) visibleRef.current.textContent = "";
    };
  }, [active, text, startDelayMs, prefersReducedMotion, stopAnim]);

  return (
    <span
      className={className}
      style={{ display: "inline-block", position: "relative" }}
    >
      <span className="invisible select-none whitespace-pre-wrap">{text}</span>
      <span
        ref={visibleRef}
        aria-hidden
        className="absolute inset-0 whitespace-pre-wrap"
      />
    </span>
  );
}
