"use client";

import * as React from "react";

const DEFAULT_SCRAMBLE_CHARS =
  "!<>-_\\/[]{}—=+*^?#abcdefghijklmnopqrstuvwxyz0123456789";

type ScrambleTextProps = {
  text: string;
  /**
   * Optional previous text used as the "starting" content.
   * Useful for directional swaps (keep old copy until the wave reaches it).
   */
  fromText?: string;
  /**
   * If false, renders the final text immediately without any animation.
   */
  scramble?: boolean;
  /**
   * Approximate total duration of the reveal in ms. Each character gets a
   * randomized start/end inside this window, so the actual length varies.
   */
  durationMs?: number;
  /**
   * Delay before the scramble starts (useful for staggering paragraphs).
   */
  startDelayMs?: number;
  /**
   * Controls how often the scramble updates. Higher = calmer.
   */
  tickMs?: number;
  /**
   * Maximum number of glyph swaps per character while scrambling.
   * Lower = calmer.
   */
  maxSwapsPerChar?: number;
  /**
   * Scramble direction. "ltr" reveals progressively left-to-right.
   */
  direction?: "random" | "ltr";
  /**
   * Character pool used while scrambling.
   */
  chars?: string;
  className?: string;
};

export function ScrambleText({
  text,
  fromText,
  scramble = true,
  durationMs = 900,
  startDelayMs = 0,
  tickMs = 58,
  maxSwapsPerChar = 3,
  direction = "random",
  chars = DEFAULT_SCRAMBLE_CHARS,
  className,
}: ScrambleTextProps) {
  const getRandomChar = React.useCallback(() => {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }, [chars]);

  const reduceMotion = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  }, []);

  const initialDisplay = React.useMemo(() => {
    if (!scramble || reduceMotion) return text;
    if (fromText && direction === "ltr") {
      const fromChars = Array.from(fromText);
      const toChars = Array.from(text);
      const out: string[] = [];
      for (let i = 0; i < toChars.length; i += 1) {
        out.push(fromChars[i] ?? " ");
      }
      return out.join("");
    }
    return Array.from(text)
      .map((ch) => (ch === " " || ch === "\n" ? ch : getRandomChar()))
      .join("");
  }, [text, fromText, direction, scramble, reduceMotion, getRandomChar]);

  const [display, setDisplay] = React.useState(initialDisplay);

  React.useEffect(() => {
    if (!scramble || reduceMotion) {
      setDisplay(text);
      return;
    }

    const TICK_MS = Math.max(34, tickMs);
    const totalTicks = Math.max(1, Math.round(durationMs / TICK_MS));
    const targetChars = Array.from(text);
    const fromChars =
      fromText && direction === "ltr" ? Array.from(fromText) : null;

    const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));

    const queue = targetChars.map((ch, idx) => {
      const isWhitespace = ch === " " || ch === "\n";
      const from = fromChars ? fromChars[idx] ?? " " : null;
      const start =
        direction === "ltr"
          ? Math.floor((idx / Math.max(1, targetChars.length - 1)) * totalTicks * 0.55)
          : Math.floor(Math.random() * totalTicks * 0.18);
      const minLen = Math.floor(totalTicks * 0.55);
      const len = clamp(
        minLen + Math.floor(Math.random() * (totalTicks * 0.45)),
        10,
        totalTicks + 6,
      );
      const swaps = isWhitespace
        ? 0
        : clamp(1 + Math.floor(Math.random() * maxSwapsPerChar), 1, 8);
      const windowLen = Math.max(1, len);
      const swapEvery = Math.max(1, Math.floor(windowLen / (swaps + 1)));
      return {
        to: ch,
        from,
        start,
        end: start + len,
        current: isWhitespace ? ch : getRandomChar(),
        swapsRemaining: swaps,
        nextSwapAt: start + swapEvery,
        swapEvery,
      };
    });

    let tick = 0;
    let timerId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let startTimer: ReturnType<typeof setTimeout> | null = null;

    const step = () => {
      if (cancelled) return;
      let output = "";
      let complete = 0;
      for (const q of queue) {
        if (q.to === " " || q.to === "\n") {
          output += q.to;
          complete += 1;
          continue;
        }
        if (tick >= q.end) {
          output += q.to;
          complete += 1;
        } else if (tick >= q.start) {
          if (q.swapsRemaining > 0 && tick >= q.nextSwapAt) {
            q.current = getRandomChar();
            q.swapsRemaining -= 1;
            q.nextSwapAt += q.swapEvery;
          }
          output += q.current;
        } else {
          // For LTR swaps, keep the old text until the wave arrives.
          output += q.from ?? q.current;
        }
      }
      setDisplay(output);
      if (complete >= queue.length) return;
      tick += 1;
      timerId = setTimeout(step, TICK_MS);
    };

    if (startDelayMs > 0) {
      startTimer = setTimeout(() => {
        if (cancelled) return;
        timerId = setTimeout(step, TICK_MS);
      }, startDelayMs);
    } else {
      timerId = setTimeout(step, TICK_MS);
    }

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      if (startTimer) clearTimeout(startTimer);
    };
  }, [
    text,
    fromText,
    scramble,
    reduceMotion,
    durationMs,
    startDelayMs,
    tickMs,
    maxSwapsPerChar,
    direction,
    getRandomChar,
  ]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span
        aria-hidden="true"
        className={className}
        style={{ display: "inline-block", position: "relative" }}
      >
        {/* Reserve layout using final text, but keep it visually hidden */}
        <span style={{ visibility: "hidden", whiteSpace: "pre-wrap" }}>{text}</span>
        {/* Overlay scrambled glyphs without affecting layout */}
        <span
          style={{
            position: "absolute",
            inset: 0,
            whiteSpace: "pre-wrap",
            overflow: "hidden",
            opacity: 0.92,
          }}
        >
          {display}
        </span>
      </span>
    </>
  );
}
