"use client";

import { animate, scrambleText, type JSAnimation } from "animejs";
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
  const animRef = React.useRef<JSAnimation | null>(null);

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

  const stopAnim = React.useCallback(() => {
    animRef.current?.revert();
    animRef.current = null;
  }, []);

  React.useLayoutEffect(() => {
    const apply = () => {
      const el = getTarget();
      if (!el) return false;
      if (!play || reduceMotion) {
        stopAnim();
        el.textContent = text;
        return true;
      }
      if (fromText !== undefined && fromText === text) {
        stopAnim();
        el.textContent = text;
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
  }, [text, play, reduceMotion, fromText, stopAnim, getTarget]);

  React.useEffect(() => {
    const el = getTarget();
    if (!el || !play || reduceMotion) return;

    if (fromText !== undefined && fromText === text) return;

    stopAnim();

    const hasCrossfade =
      fromText !== undefined && fromText.length > 0 && fromText !== text;
    el.textContent = hasCrossfade ? fromText : "";

    /** Sempre progressivo (ex.: esquerda → direita); evita morph “auto” caótico. */
    const scrambleFrom = from;

    const delayMs = Math.max(0, startDelayMs);
    const delayId = window.setTimeout(() => {
      const anim = animate(el, {
        textContent: scrambleText({
          text,
          ease: scrambleEase,
          override: scrambleOverride,
          revealRate,
          settleDuration,
          settleRate,
          chars,
          from: scrambleFrom,
        }),
      });
      animRef.current = anim;
      void anim.then(() => {
        if (animRef.current === anim) animRef.current = null;
      });
    }, delayMs);

    return () => {
      window.clearTimeout(delayId);
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
    from,
    stopAnim,
    getTarget,
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
      />
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
