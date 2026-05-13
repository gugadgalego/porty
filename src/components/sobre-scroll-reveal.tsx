"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Só começa a observar entrada no viewport depois do primeiro scroll (ritmo com o hero). */
  scrollUnlocked: boolean;
  /** Atraso extra na transição quando o bloco entra em vista (escalonar itens). */
  revealDelayMs?: number;
  /**
   * `fade`: só opacidade — evita `transform` aninhado com filhos que também animam `transform`
   * (ex.: polaroids com rotação + sombras, onde filtros/boxes compõem mal ao scroll).
   * Default: entrada com leve `translateY` como os itens da timeline.
   */
  revealMotion?: "slide-up" | "fade";
};

const REVEAL_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const REVEAL_DURATION_MS = 980;

/**
 * Revela o bloco quando cruza o viewport ao descer (IntersectionObserver),
 * com opacidade + leve translateY — ritmo semelhante a páginas tipo ja.mt/work.
 */
export function SobreScrollReveal({
  children,
  className,
  scrollUnlocked,
  revealDelayMs = 0,
  revealMotion = "slide-up",
}: Props) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = React.useState(false);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const fn = () => setReduced(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  React.useEffect(() => {
    if (reduced) {
      setInView(true);
      return;
    }
    if (!scrollUnlocked) return;
    const el = rootRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            break;
          }
        }
      },
      {
        threshold: 0.06,
        rootMargin: "0px 0px -10% 0px",
      },
    );

    io.observe(el);
    const sync = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.top < vh * 0.94 && r.bottom > vh * 0.06) setInView(true);
    };
    sync();

    return () => io.disconnect();
  }, [scrollUnlocked, reduced]);

  const revealed = reduced || inView;
  const fadeOnly = revealMotion === "fade";

  /** Atraso só na animação de entrada (evita re-aplicar após já visível). */
  const entranceDelayMs =
    !reduced && revealDelayMs > 0 && revealed ? revealDelayMs : 0;

  return (
    <div
      ref={rootRef}
      className={cn(
        fadeOnly ? "[will-change:opacity]" : "will-change-[opacity,transform]",
        className,
      )}
      style={{
        opacity: revealed ? 1 : 0,
        transform: fadeOnly
          ? undefined
          : revealed
            ? "translate3d(0, 0, 0)"
            : "translate3d(0, 2rem, 0)",
        transitionProperty: fadeOnly ? "opacity" : "opacity, transform",
        transitionDuration: reduced ? "200ms" : `${REVEAL_DURATION_MS}ms`,
        transitionTimingFunction: REVEAL_EASE,
        transitionDelay: `${entranceDelayMs}ms`,
      }}
    >
      {children}
    </div>
  );
}
