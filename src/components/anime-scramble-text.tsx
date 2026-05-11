"use client";

import * as React from "react";
import { INTRO_SCRAMBLE } from "@/lib/intro-scramble";

type Mode = "phrase" | "decorative";

export type AnimeScrambleTextProps = {
  text: string;
  play?: boolean;
  fromText?: string;
  mode?: Mode;
  startDelayMs?: number;
  revealRate?: number;
  settleDuration?: number;
  settleRate?: number;
  /** Easing da progressão do reveal — passado só a `scrambleText({ ease })`, não ao `animate()`. */
  scrambleEase?: string;
  /** Igual à API Anime: `false` mantém o texto de origem até a onda de revelação. */
  scrambleOverride?: boolean;
  chars?: string;
  from?: "left" | "right" | "center" | "random" | "auto";
  className?: string;
  /**
   * Anima o `textContent` deste nó (ex.: `<a>`, `<button>`, ou qualquer host com
   * `data-scramble`) em vez de um `<span>` interno. Não renderiza DOM extra;
   * o host mantém atributos, foco e eventos. Só com `mode="decorative"`.
   */
  scrambleTargetRef?: React.RefObject<HTMLElement | null>;
};

function AnimeScrambleTextInner({
  text,
  play = false,
  fromText,
  mode = "phrase",
  startDelayMs = 0,
  revealRate = INTRO_SCRAMBLE.revealRate,
  settleDuration = INTRO_SCRAMBLE.settleDuration,
  settleRate = INTRO_SCRAMBLE.settleRate,
  scrambleEase = INTRO_SCRAMBLE.scrambleEase,
  scrambleOverride = INTRO_SCRAMBLE.scrambleOverride,
  chars = INTRO_SCRAMBLE.chars,
  from = INTRO_SCRAMBLE.from,
  className,
  scrambleTargetRef,
}: AnimeScrambleTextProps) {
  const visualRef = React.useRef<HTMLSpanElement>(null);
  const rafRef = React.useRef<number | null>(null);
  const [visualText, setVisualText] = React.useState(text);
  const visualTextRef = React.useRef(text);

  const getTarget = React.useCallback((): HTMLElement | null => {
    if (scrambleTargetRef) return scrambleTargetRef.current;
    return visualRef.current;
  }, [scrambleTargetRef]);

  const [reduceMotion, setReduceMotion] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const commitText = React.useCallback(
    (next: string) => {
      if (visualTextRef.current === next) return;
      visualTextRef.current = next;
      if (scrambleTargetRef) {
        const target = scrambleTargetRef.current;
        if (target) target.textContent = next;
        return;
      }
      setVisualText(next);
    },
    [scrambleTargetRef],
  );

  const stopAnim = React.useCallback(() => {
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const orderForIndex = React.useCallback(
    (idx: number, total: number): number => {
      switch (from) {
        case "right":
          return total - idx - 1;
        case "center":
          return Math.abs(idx - Math.floor(total / 2)) * 2;
        case "random":
          return (idx * 17) % Math.max(total, 1);
        case "auto":
        case "left":
        default:
          return idx;
      }
    },
    [from],
  );

  const randomCharAt = React.useCallback(
    (idx: number, frame: number): string => {
      if (chars.length === 0) return "";
      const charIdx = Math.abs((idx * 13 + frame * 7) % chars.length);
      return chars[charIdx] ?? "";
    },
    [chars],
  );

  React.useLayoutEffect(() => {
    const apply = () => {
      const el = getTarget();
      if (!el) return false;
      if (!play || reduceMotion) {
        stopAnim();
        commitText(text);
        return true;
      }
      if (fromText !== undefined && fromText === text) {
        stopAnim();
        commitText(text);
      }
      return true;
    };

    if (apply()) return;

    let cancelled = false;
    const id = requestAnimationFrame(() => {
      if (cancelled) return;
      apply();
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [text, play, reduceMotion, fromText, stopAnim, getTarget, commitText]);

  React.useEffect(() => {
    const el = getTarget();
    if (!el || !play || reduceMotion) return;

    if (fromText !== undefined && fromText === text) return;

    stopAnim();

    const hasCrossfade =
      fromText !== undefined && fromText.length > 0 && fromText !== text;
    const source = hasCrossfade ? (fromText ?? "") : visualTextRef.current;
    const sourceChars = Array.from(source);
    const targetChars = Array.from(text);
    const total = Math.max(sourceChars.length, targetChars.length);
    const characterDelayMs = Math.max(4, 1000 / Math.max(revealRate, 1));
    const randomFrameMs = Math.max(12, settleDuration / Math.max(settleRate, 1));
    const delayMs = Math.max(0, startDelayMs);
    const startedAt = window.performance.now();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      let done = true;
      const next = Array.from({ length: total }, (_, idx) => {
        const target = targetChars[idx] ?? "";
        const sourceChar = sourceChars[idx] ?? " ";
        const charDelay = delayMs + orderForIndex(idx, total) * characterDelayMs;
        const localElapsed = elapsed - charDelay;

        if (localElapsed < 0) {
          done = false;
          if (!scrambleOverride || !target || /\s/.test(target)) {
            return sourceChar;
          }
          return randomCharAt(idx, 0);
        }

        if (localElapsed < settleDuration) {
          done = false;
          if (!target || /\s/.test(target)) return target;
          const frame = Math.floor(localElapsed / randomFrameMs);
          return randomCharAt(idx, frame);
        }

        return target;
      });

      commitText(next.join(""));

      if (!done) {
        rafRef.current = window.requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
        commitText(text);
      }
    };

    rafRef.current = window.requestAnimationFrame(tick);

    return () => {
      stopAnim();
    };
  }, [
    text,
    play,
    reduceMotion,
    fromText,
    startDelayMs,
    revealRate,
    settleDuration,
    settleRate,
    scrambleEase,
    scrambleOverride,
    chars,
    stopAnim,
    getTarget,
    commitText,
    orderForIndex,
    randomCharAt,
  ]);

  const ariaHidden = mode === "phrase" || mode === "decorative";

  if (mode === "decorative" && scrambleTargetRef) {
    return null;
  }

  return (
    <>
      {mode === "phrase" ? (
        <span className="sr-only">{text}</span>
      ) : null}
      <span
        ref={visualRef}
        data-scramble=""
        className={className}
        aria-hidden={ariaHidden || undefined}
      >
        {visualText}
      </span>
    </>
  );
}

function propsEqual(
  a: AnimeScrambleTextProps,
  b: AnimeScrambleTextProps,
): boolean {
  return (
    a.text === b.text &&
    a.play === b.play &&
    a.fromText === b.fromText &&
    a.mode === b.mode &&
    a.startDelayMs === b.startDelayMs &&
    a.revealRate === b.revealRate &&
    a.settleDuration === b.settleDuration &&
    a.settleRate === b.settleRate &&
    a.scrambleEase === b.scrambleEase &&
    a.scrambleOverride === b.scrambleOverride &&
    a.chars === b.chars &&
    a.from === b.from &&
    a.className === b.className &&
    a.scrambleTargetRef === b.scrambleTargetRef
  );
}

export const AnimeScrambleText = React.memo(
  AnimeScrambleTextInner,
  propsEqual,
);
