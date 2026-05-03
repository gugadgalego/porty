"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { animate, scrambleText, type JSAnimation } from "animejs";
import { useCallback, useEffect, useLayoutEffect, useRef, type FocusEvent } from "react";
import { cn } from "@/lib/utils";

const TODOS_LABEL = "Todos";

const titleSpanClass =
  "max-w-full text-balance font-serif text-[14px] font-normal italic leading-[1.3] text-[#0C0A09] dark:text-[#fafaf9]";

type DesignProjectTitleLinkProps = {
  title: string;
  ariaLabel: string;
  href: string;
  className?: string;
};

export function DesignProjectTitleLink({
  title,
  ariaLabel,
  href,
  className,
}: DesignProjectTitleLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const visibleRef = useRef<HTMLSpanElement>(null);
  const animRef = useRef<JSAnimation | null>(null);
  const reducedMotionRef = useRef(false);
  const latestTitle = useRef(title);
  const lastSyncedTitle = useRef<string | null>(null);

  latestTitle.current = title;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotionRef.current = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const stopAnim = useCallback(() => {
    if (animRef.current) {
      animRef.current.revert();
      animRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    const el = visibleRef.current;
    if (!el) return;
    if (lastSyncedTitle.current === title) return;
    lastSyncedTitle.current = title;
    stopAnim();
    el.textContent = title;
  }, [title, stopAnim]);

  useEffect(() => () => stopAnim(), [stopAnim]);

  const showTodos = useCallback(() => {
    const el = visibleRef.current;
    if (!el) return;

    if (reducedMotionRef.current) {
      stopAnim();
      el.textContent = TODOS_LABEL;
      return;
    }

    if (el.textContent === TODOS_LABEL && !animRef.current) return;

    stopAnim();

    const anim = animate(el, {
      textContent: scrambleText({
        text: TODOS_LABEL,
        ease: "outQuad",
        revealRate: 72,
        settleDuration: 220,
      }),
      ease: "outQuad",
    });
    animRef.current = anim;
    void anim.then(() => {
      if (animRef.current === anim) animRef.current = null;
    });
  }, [stopAnim]);

  const showProjectTitle = useCallback(() => {
    const el = visibleRef.current;
    if (!el) return;

    const t = latestTitle.current;

    if (reducedMotionRef.current) {
      stopAnim();
      el.textContent = t;
      return;
    }

    if (el.textContent === t && !animRef.current) return;

    stopAnim();

    const anim = animate(el, {
      textContent: scrambleText({
        text: t,
        ease: "outQuad",
        revealRate: 72,
        settleDuration: 220,
      }),
      ease: "outQuad",
    });
    animRef.current = anim;
    void anim.then(() => {
      if (animRef.current === anim) animRef.current = null;
    });
  }, [stopAnim]);

  const handlePointerEnter = useCallback(() => {
    showTodos();
  }, [showTodos]);

  const handlePointerLeave = useCallback(() => {
    const link = linkRef.current;
    if (link?.matches(":focus-visible")) return;
    showProjectTitle();
  }, [showProjectTitle]);

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLAnchorElement>) => {
      requestAnimationFrame(() => {
        if (e.currentTarget.matches(":focus-visible")) showTodos();
      });
    },
    [showTodos],
  );

  const handleBlur = useCallback(() => {
    showProjectTitle();
  }, [showProjectTitle]);

  return (
    <Link
      ref={linkRef}
      href={href}
      aria-label={ariaLabel}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        "group relative grid max-w-full place-items-start [grid-template-areas:'stack'] outline-none focus-visible:ring-2 focus-visible:ring-stone-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fafaf9] dark:focus-visible:ring-stone-500 dark:focus-visible:ring-offset-stone-950",
        className,
      )}
    >
      <span className={cn("[grid-area:stack] invisible max-w-full", titleSpanClass)} aria-hidden>
        {title}
      </span>
      <span
        className={cn(
          "[grid-area:stack] invisible flex max-w-full items-baseline gap-1.5",
          titleSpanClass,
        )}
        aria-hidden
      >
        <ArrowLeft className="size-4 shrink-0" weight="regular" aria-hidden />
        <span>{TODOS_LABEL}</span>
      </span>
      <span
        className={cn(
          "[grid-area:stack] relative z-10 flex max-w-full min-w-0 items-baseline gap-1.5",
        )}
      >
        <span
          className="inline-flex max-w-0 shrink-0 overflow-hidden opacity-0 transition-[max-width,opacity] duration-200 ease-out group-hover:max-w-[1.25rem] group-hover:opacity-100 group-focus-within:max-w-[1.25rem] group-focus-within:opacity-100 motion-reduce:transition-none"
          aria-hidden
        >
          <ArrowLeft className="size-4 text-[#0C0A09] dark:text-[#fafaf9]" weight="regular" />
        </span>
        <span ref={visibleRef} className={cn("min-w-0", titleSpanClass)} aria-hidden />
      </span>
    </Link>
  );
}
