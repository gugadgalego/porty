"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
} from "react";
import { EditorialLocaleScramble } from "@/components/editorial-locale-scramble";
import { INTRO_EDITORIAL_SCRAMBLE } from "@/lib/intro-scramble";
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

type LabelMode = "title" | "todos";

export function DesignProjectTitleLink({
  title,
  ariaLabel,
  href,
  className,
}: DesignProjectTitleLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null);
  const reducedMotionRef = useRef(false);
  const [mode, setMode] = useState<LabelMode>("title");
  const [scrambleSession, setScrambleSession] = useState(0);
  const [hoverScrambleStarted, setHoverScrambleStarted] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      reducedMotionRef.current = mq.matches;
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    setScrambleSession((s) => s + 1);
  }, [title]);

  const bumpScramble = useCallback(() => {
    setScrambleSession((s) => s + 1);
  }, []);

  const showTodos = useCallback(() => {
    if (reducedMotionRef.current) {
      setMode("todos");
      return;
    }
    setHoverScrambleStarted(true);
    setMode("todos");
    bumpScramble();
  }, [bumpScramble]);

  const showProjectTitle = useCallback(() => {
    if (reducedMotionRef.current) {
      setMode("title");
      return;
    }
    setMode("title");
    bumpScramble();
  }, [bumpScramble]);

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

  const target = mode === "todos" ? TODOS_LABEL : title;
  const source =
    hoverScrambleStarted && mode === "todos"
      ? title
      : hoverScrambleStarted && mode === "title"
        ? TODOS_LABEL
        : undefined;

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
        <EditorialLocaleScramble
          target={target}
          source={source}
          active={hoverScrambleStarted}
          runKey={scrambleSession}
          duration={0.26}
          perCharPadSec={0.01}
          waveWidth={3}
          characterSet={INTRO_EDITORIAL_SCRAMBLE.characterSet}
          easeExponent={2.1}
          className={cn("min-h-[1lh] min-w-0", titleSpanClass)}
        />
      </span>
    </Link>
  );
}
