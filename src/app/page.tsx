"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrambleText } from "@/components/scramble-text";
import { useLanguage } from "@/components/providers/language-provider";
import { dictionaries } from "@/lib/i18n";

const TYPE_SPEED_INITIAL_MS = 90;
const POST_TYPE_HOLD_INITIAL_MS = 320;
const DRAMATIC_PAUSE_MS = 1050;
const INTRO_REVEAL_DELAY_MS = POST_TYPE_HOLD_INITIAL_MS + DRAMATIC_PAUSE_MS;
const CHROME_REVEAL_DELAY_MS = INTRO_REVEAL_DELAY_MS + 700;

/** Curva mais suave (acelera e desacelera devagar). */
const NAV_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
/** Grelha de projetos: entrada em cascata (baixo → cima, um a um). */
const PROJECT_CARD_STAGGER_MS = 70;
const PROJECT_CARD_DURATION_MS = 420;
const PROJECT_CARD_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
/** Nav (Design): mesma “respiração” dos cartões — primeiro some no meio, reaparece no rodapé, depois a grid. */
const NAV_ITEM_STAGGER_MS = PROJECT_CARD_STAGGER_MS;
const NAV_ITEM_DURATION_MS = PROJECT_CARD_DURATION_MS;
const NAV_SEQUENCE_BUFFER_MS = 40;
/** Transição de altura do bloco de intro (troca de idioma / re-medida) + a nav acompanha no fluxo. */
const INTRO_MIN_HEIGHT_MS = 520;
const INTRO_BLOCK_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
/** Encolher (ex.: EN): mantém a curva que já estava agradável. */
const INTRO_HEIGHT_SHRINK_MS = INTRO_MIN_HEIGHT_MS;
const INTRO_HEIGHT_SHRINK_EASE = INTRO_BLOCK_EASE;
/** Expandir (ex.: PT): mais tempo + ease-out longo no fim para não parecer “seca”. */
const INTRO_HEIGHT_EXPAND_MS = 680;
const INTRO_HEIGHT_EXPAND_EASE = "cubic-bezier(0.16, 1, 0.2, 1)";

const projects: {
  id: string;
  title: string;
  subtitle: string;
  image: string;
}[] = [
  {
    id: "p1",
    title: "Papelzinho",
    subtitle: "Orla — Mobile",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p2",
    title: "SME",
    subtitle: "Mackenzie — Web",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p3",
    title: "Porty",
    subtitle: "Portfolio",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p4",
    title: "Academy",
    subtitle: "Apple Developer Academy",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p5",
    title: "Case #5",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p6",
    title: "Case #6",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p7",
    title: "Case #7",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p8",
    title: "Case #8",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
  {
    id: "p9",
    title: "Case #9",
    subtitle: "Em breve",
    image: "https://paper.design/flowers.webp",
  },
];

/** Anula o `Button` padrão (`inline-flex` + `nowrap`) para o texto fluir e centralizar no parágrafo. */
const introLinkButtonClass = cn(
  "h-auto min-h-0 !inline w-auto !justify-start p-0 font-serif text-[14px] font-light leading-[1.55] tracking-[-0.02em] text-muted-foreground",
  "decoration-muted-foreground/40 underline-offset-[3px] hover:text-foreground",
  "!whitespace-normal",
);

export default function Home() {
  const { dictionary, locale, toggleLocale, ready: languageReady } =
    useLanguage();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";
  const themeLabel = isDark
    ? dictionary.themeToggleToLight
    : dictionary.themeToggleToDark;

  const welcomeFull = dictionary.welcome;
  const [typed, setTyped] = React.useState("");
  const [typingDone, setTypingDone] = React.useState(false);
  const [introVisible, setIntroVisible] = React.useState(false);
  const [chromeVisible, setChromeVisible] = React.useState(false);
  const [projectsView, setProjectsView] = React.useState(false);
  const [revealKey, setRevealKey] = React.useState(0);
  const prevWelcomeRef = React.useRef<string | null>(null);
  const hasTypedWelcomeOnceRef = React.useRef(false);

  const [introMinHeight, setIntroMinHeight] = React.useState<number | null>(
    null,
  );
  const [introHeightMotion, setIntroHeightMotion] = React.useState<{
    durationMs: number;
    easing: string;
  }>({ durationMs: INTRO_MIN_HEIGHT_MS, easing: INTRO_BLOCK_EASE });
  const lastIntroMinHeightRef = React.useRef<number | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] =
    React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const measurePtRef = React.useRef<HTMLDivElement | null>(null);
  const measureEnRef = React.useRef<HTMLDivElement | null>(null);

  const bottomNavRef = React.useRef<HTMLElement | null>(null);
  /** Depois do stagger-in dos botões no rodapé: libera a grid (cascata dos cards). */
  const [projectNavReadyForGrid, setProjectNavReadyForGrid] =
    React.useState(false);
  /** Altura medida da barra fixa; padding do scroll = isto, para o conteúdo nunca passar “por baixo” da nav. */
  const [projectNavBlockPx, setProjectNavBlockPx] = React.useState(0);
  /** Após 1 rAF, dispara a cascata dos cartões (só com nav já encostada). */
  const [projectCardsRevealed, setProjectCardsRevealed] = React.useState(false);
  /**
   * Coreografia da transição Design:
   *  - idle: home normal
   *  - exiting: hero nav buttons somem (right-to-left)
   *  - entering: bottom nav buttons aparecem (left-to-right)
   *  - entered: grid libera
   */
  const [navItemPhase, setNavItemPhase] = React.useState<
    "idle" | "exiting" | "entering" | "entered"
  >("idle");
  const navTransitionTimersRef = React.useRef<number[]>([]);

  const clearNavTransitionTimers = React.useCallback(() => {
    for (const id of navTransitionTimersRef.current) {
      window.clearTimeout(id);
    }
    navTransitionTimersRef.current = [];
  }, []);

  React.useEffect(() => {
    if (!projectNavReadyForGrid) {
      setProjectCardsRevealed(false);
      return;
    }
    if (prefersReducedMotion) {
      setProjectCardsRevealed(true);
      return;
    }
    let raf0 = 0;
    let raf1 = 0;
    raf0 = requestAnimationFrame(() => {
      raf1 = requestAnimationFrame(() => setProjectCardsRevealed(true));
    });
    return () => {
      cancelAnimationFrame(raf0);
      cancelAnimationFrame(raf1);
    };
  }, [projectNavReadyForGrid, prefersReducedMotion]);

  React.useEffect(() => {
    if (!languageReady) return;

    const isLocaleChange =
      prevWelcomeRef.current !== null &&
      prevWelcomeRef.current !== welcomeFull;
    prevWelcomeRef.current = welcomeFull;

    if (isLocaleChange) {
      setRevealKey((k) => k + 1);
    }

    if (hasTypedWelcomeOnceRef.current) {
      setTyped(welcomeFull);
      setTypingDone(true);
      return;
    }
    hasTypedWelcomeOnceRef.current = true;

    setTyped("");
    setTypingDone(false);

    const speed = TYPE_SPEED_INITIAL_MS;
    const postHold = POST_TYPE_HOLD_INITIAL_MS;

    let i = 0;
    const typeInterval = setInterval(() => {
      i += 1;
      setTyped(welcomeFull.slice(0, i));
      if (i >= welcomeFull.length) clearInterval(typeInterval);
    }, speed);

    const typingDoneT = setTimeout(
      () => setTypingDone(true),
      welcomeFull.length * speed + postHold,
    );

    return () => {
      clearInterval(typeInterval);
      clearTimeout(typingDoneT);
    };
  }, [languageReady, welcomeFull]);

  React.useEffect(() => {
    if (!languageReady) return;
    const initialTypingMs = welcomeFull.length * TYPE_SPEED_INITIAL_MS;
    const introT = setTimeout(
      () => setIntroVisible(true),
      initialTypingMs + INTRO_REVEAL_DELAY_MS,
    );
    const chromeT = setTimeout(
      () => setChromeVisible(true),
      initialTypingMs + CHROME_REVEAL_DELAY_MS,
    );
    return () => {
      clearTimeout(introT);
      clearTimeout(chromeT);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageReady]);

  const sections = [
    { label: dictionary.sections.design, href: "#design", isProjects: true },
    { label: dictionary.sections.dev, href: "#dev", isProjects: false },
    { label: dictionary.sections.about, href: "#sobre", isProjects: false },
    { label: dictionary.sections.cv, href: "#cv", isProjects: false },
  ];

  const shouldScrambleOnThisRender = revealKey > 0;

  /** Altura do parágrafo de intro só do idioma ativo → o bloco encolhe/cresce e o flex recentraliza suavemente (min-height com transição). */
  React.useLayoutEffect(() => {
    if (!introVisible) return;

    const measure = () => {
      const pt = measurePtRef.current?.getBoundingClientRect().height ?? 0;
      const en = measureEnRef.current?.getBoundingClientRect().height ?? 0;
      const target = locale === "pt" ? pt : en;
      const fallback = Math.max(pt, en);
      const next = Math.ceil(target > 0 ? target : fallback);
      if (next <= 0) return;

      const prev = lastIntroMinHeightRef.current;
      const delta = prev === null ? 0 : next - prev;
      const threshold = 2;
      if (prev === null) {
        setIntroHeightMotion({
          durationMs: INTRO_MIN_HEIGHT_MS,
          easing: INTRO_BLOCK_EASE,
        });
      } else if (delta > threshold) {
        setIntroHeightMotion({
          durationMs: INTRO_HEIGHT_EXPAND_MS,
          easing: INTRO_HEIGHT_EXPAND_EASE,
        });
      } else if (delta < -threshold) {
        setIntroHeightMotion({
          durationMs: INTRO_HEIGHT_SHRINK_MS,
          easing: INTRO_HEIGHT_SHRINK_EASE,
        });
      }

      lastIntroMinHeightRef.current = next;
      setIntroMinHeight(next);
    };

    measure();
    const ptEl = measurePtRef.current;
    const enEl = measureEnRef.current;
    const ro = new ResizeObserver(measure);
    if (ptEl) ro.observe(ptEl);
    if (enEl) ro.observe(enEl);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [introVisible, locale]);

  /** Ao sair de Projetos (futuro) ou forçar reset, limpa timers/estado da nav. */
  React.useEffect(() => {
    if (projectsView) return;
    clearNavTransitionTimers();
    setProjectNavReadyForGrid(false);
    setProjectNavBlockPx(0);
    setNavItemPhase("idle");
  }, [projectsView, clearNavTransitionTimers]);

  /** Mede a altura real da barra fixa (incl. safe area) → scroll do #design não passa por baixo. */
  React.useEffect(() => {
    if (!projectsView) {
      setProjectNavBlockPx(0);
      return;
    }
    const nav = bottomNavRef.current;
    if (!nav) return;
    const update = () => {
      setProjectNavBlockPx(Math.ceil(nav.getBoundingClientRect().height));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(nav);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [projectsView]);

  const handleDesignClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (projectsView) return;
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setProjectsView(true);
        setProjectNavReadyForGrid(true);
        setNavItemPhase("entered");
        return;
      }

      clearNavTransitionTimers();
      setProjectNavReadyForGrid(false);
      setProjectCardsRevealed(false);
      setNavItemPhase("exiting");
      setProjectsView(true);

      const count = sections.length;
      const exitTotalMs =
        Math.max(0, count - 1) * NAV_ITEM_STAGGER_MS +
        NAV_ITEM_DURATION_MS +
        NAV_SEQUENCE_BUFFER_MS;

      const tEnter = window.setTimeout(() => {
        setNavItemPhase("entering");
        const enterTotalMs =
          Math.max(0, count - 1) * NAV_ITEM_STAGGER_MS +
          NAV_ITEM_DURATION_MS +
          NAV_SEQUENCE_BUFFER_MS;
        const tReady = window.setTimeout(() => {
          setNavItemPhase("entered");
          setProjectNavReadyForGrid(true);
        }, enterTotalMs);
        navTransitionTimersRef.current.push(tReady);
      }, exitTotalMs);
      navTransitionTimersRef.current.push(tEnter);
    },
    [projectsView, clearNavTransitionTimers, sections.length],
  );

  const renderIntro = React.useCallback(
    (text: string, idx: number) => {
      const parts = text.split(
        /(\{UPM\}|\{SME\}|\{PAPELZINHO\}|\{ORLA\}|\{ADA\})/g,
      );

      return (
        <>
          {(() => {
            const out: React.ReactNode[] = [];
            for (let i = 0; i < parts.length; i += 1) {
              const part = parts[i] ?? "";

              const maybeConsumeLeadingPunctuation = () => {
                const next = parts[i + 1] ?? "";
                const m = next.match(/^([,.;:!?]+)/);
                if (!m) return null;
                const punct = m[1] ?? "";
                parts[i + 1] = next.slice(punct.length);
                return punct;
              };

              if (part === "{UPM}") {
                const punct = maybeConsumeLeadingPunctuation();
                out.push(
                  <span key={`upm-wrap-${idx}-${i}`} className="inline">
                    <Button
                      asChild
                      variant="link"
                      size="xs"
                      className={introLinkButtonClass}
                    >
                      <a
                        href="https://www.mackenzie.br/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {dictionary.upmLabel}
                      </a>
                    </Button>
                    {punct}
                  </span>,
                );
                continue;
              }

              if (part === "{SME}") {
                const punct = maybeConsumeLeadingPunctuation();
                out.push(
                  <span key={`sme-wrap-${idx}-${i}`} className="inline">
                    <Button
                      asChild
                      variant="link"
                      size="xs"
                      className={introLinkButtonClass}
                    >
                      <a
                        href="https://sistemasdeensino.mackenzie.br/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        SME
                      </a>
                    </Button>
                    {punct}
                  </span>,
                );
                continue;
              }

              if (part === "{PAPELZINHO}") {
                const punct = maybeConsumeLeadingPunctuation();
                out.push(
                  <span key={`papel-wrap-${idx}-${i}`} className="inline">
                    <Button
                      asChild
                      variant="link"
                      size="xs"
                      className={introLinkButtonClass}
                    >
                      <a
                        href="https://papelzinho.com/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {dictionary.papelzinhoLabel}
                      </a>
                    </Button>
                    {punct}
                  </span>,
                );
                continue;
              }

              if (part === "{ORLA}") {
                const punct = maybeConsumeLeadingPunctuation();
                out.push(
                  <span key={`orla-wrap-${idx}-${i}`} className="inline">
                    <Button
                      asChild
                      variant="link"
                      size="xs"
                      className={introLinkButtonClass}
                    >
                      <a
                        href="https://www.orla.tech/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {dictionary.orlaLabel}
                      </a>
                    </Button>
                    {punct}
                  </span>,
                );
                continue;
              }

              if (part === "{ADA}") {
                const punct = maybeConsumeLeadingPunctuation();
                out.push(
                  <span key={`ada-wrap-${idx}-${i}`} className="inline">
                    <Button
                      asChild
                      variant="link"
                      size="xs"
                      className={introLinkButtonClass}
                    >
                      <a
                        href="https://developer.apple.com/academies/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {dictionary.appleDeveloperAcademyLabel}
                      </a>
                    </Button>
                    {punct}
                  </span>,
                );
                continue;
              }

              if (!part) continue;

              out.push(
                <ScrambleText
                  key={`intro-part-${revealKey}-${idx}-${i}-${part}`}
                  text={part}
                  scramble={shouldScrambleOnThisRender}
                  durationMs={900}
                  startDelayMs={idx * 160}
                  tickMs={52}
                  maxSwapsPerChar={2}
                  className="whitespace-pre-wrap"
                />,
              );
            }
            return out;
          })()}
        </>
      );
    },
    [
      dictionary.upmLabel,
      dictionary.papelzinhoLabel,
      dictionary.orlaLabel,
      dictionary.appleDeveloperAcademyLabel,
      revealKey,
      shouldScrambleOnThisRender,
    ],
  );

  const renderIntroStatic = React.useCallback((text: string, idx: number) => {
    const parts = text.split(
      /(\{UPM\}|\{SME\}|\{PAPELZINHO\}|\{ORLA\}|\{ADA\})/g,
    );
    return (
      <>
        {(() => {
          const out: React.ReactNode[] = [];
          for (let i = 0; i < parts.length; i += 1) {
            const part = parts[i] ?? "";

            const maybeConsumeLeadingPunctuation = () => {
              const next = parts[i + 1] ?? "";
              const m = next.match(/^([,.;:!?]+)/);
              if (!m) return null;
              const punct = m[1] ?? "";
              parts[i + 1] = next.slice(punct.length);
              return punct;
            };

            if (part === "{UPM}") {
              const punct = maybeConsumeLeadingPunctuation();
              out.push(
                <span key={`m-upm-wrap-${idx}-${i}`} className="inline">
                  <Button
                    asChild
                    variant="link"
                    size="xs"
                    className={introLinkButtonClass}
                  >
                    <a
                      href="https://www.mackenzie.br/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {dictionaries.pt.upmLabel}
                    </a>
                  </Button>
                  {punct}
                </span>,
              );
              continue;
            }

            if (part === "{SME}") {
              const punct = maybeConsumeLeadingPunctuation();
              out.push(
                <span key={`m-sme-wrap-${idx}-${i}`} className="inline">
                  <Button
                    asChild
                    variant="link"
                    size="xs"
                    className={introLinkButtonClass}
                  >
                    <a
                      href="https://sistemasdeensino.mackenzie.br/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      SME
                    </a>
                  </Button>
                  {punct}
                </span>,
              );
              continue;
            }

            if (part === "{PAPELZINHO}") {
              const punct = maybeConsumeLeadingPunctuation();
              out.push(
                <span key={`m-papel-wrap-${idx}-${i}`} className="inline">
                  <Button
                    asChild
                    variant="link"
                    size="xs"
                    className={introLinkButtonClass}
                  >
                    <a
                      href="https://papelzinho.com/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {dictionaries.pt.papelzinhoLabel}
                    </a>
                  </Button>
                  {punct}
                </span>,
              );
              continue;
            }

            if (part === "{ORLA}") {
              const punct = maybeConsumeLeadingPunctuation();
              out.push(
                <span key={`m-orla-wrap-${idx}-${i}`} className="inline">
                  <Button
                    asChild
                    variant="link"
                    size="xs"
                    className={introLinkButtonClass}
                  >
                    <a
                      href="https://www.orla.tech/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {dictionaries.pt.orlaLabel}
                    </a>
                  </Button>
                  {punct}
                </span>,
              );
              continue;
            }

            if (part === "{ADA}") {
              const punct = maybeConsumeLeadingPunctuation();
              out.push(
                <span key={`m-ada-wrap-${idx}-${i}`} className="inline">
                  <Button
                    asChild
                    variant="link"
                    size="xs"
                    className={introLinkButtonClass}
                  >
                    <a
                      href="https://developer.apple.com/academies/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {dictionaries.pt.appleDeveloperAcademyLabel}
                    </a>
                  </Button>
                  {punct}
                </span>,
              );
              continue;
            }

            if (!part) continue;
            out.push(
              <span key={`m-t-${idx}-${i}`} className="whitespace-pre-wrap">
                {part}
              </span>,
            );
          }
          return out;
        })()}
      </>
    );
  }, []);

  const navContainerClass = cn(
    "flex w-full items-stretch justify-center",
    "px-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1.5",
    "bg-background",
  );

  const renderNavButtons = (opts: {
    scope: "hero" | "bottom";
  }) => {
    const isHero = opts.scope === "hero";
    return sections.map((section, idx) => {
      const lastIdx = sections.length - 1;

      let opacity = 1;
      if (isHero) {
        if (navItemPhase === "exiting") opacity = 0;
        else if (navItemPhase === "entering" || navItemPhase === "entered") opacity = 0;
        else opacity = chromeVisible ? 1 : 0;
      } else {
        if (navItemPhase === "entering" || navItemPhase === "entered") opacity = 1;
        else opacity = 0;
      }

      let delayMs = 0;
      if (isHero) {
        if (navItemPhase === "exiting") {
          delayMs = (lastIdx - idx) * NAV_ITEM_STAGGER_MS;
        } else if (!projectsView) {
          delayMs = chromeVisible ? idx * 130 : 0;
        }
      } else {
        if (navItemPhase === "entering") {
          delayMs = idx * NAV_ITEM_STAGGER_MS;
        }
      }

      return (
        <div
          key={`${opts.scope}-${section.href}`}
          className="flex-1"
          style={{
            opacity,
            transition: `opacity ${NAV_ITEM_DURATION_MS}ms ${NAV_EASE}`,
            transitionDelay: `${delayMs}ms`,
          }}
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full font-mono text-[12px] tracking-wide"
          >
            <a
              href={section.href}
              onClick={
                isHero && section.isProjects ? handleDesignClick : undefined
              }
              tabIndex={isHero ? (projectsView ? -1 : 0) : projectsView ? 0 : -1}
              aria-hidden={isHero ? projectsView : !projectsView}
            >
              {section.label}
            </a>
          </Button>
        </div>
      );
    });
  };

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-background">
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex w-full items-center justify-between bg-background px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-2",
          "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
          chromeVisible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleLocale}
          aria-label="Alternar idioma"
          className="font-mono text-[12px] tracking-wide"
        >
          {dictionary.languageToggle}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setTheme(isDark ? "light" : "dark")}
          aria-label="Alternar tema"
          className="font-mono text-[12px] tracking-wide"
        >
          {themeLabel}
        </Button>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col pt-[calc(env(safe-area-inset-top,0px)+3.25rem)]">
        {/* HERO: layout totalmente estático. A nav do hero só muda `opacity` dos botões. */}
        <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 [scrollbar-gutter:stable]">
          <div
            className={cn(
              "flex w-full max-w-[20rem] flex-col items-center py-6",
              introVisible ? "gap-6" : "gap-0",
            )}
          >
            <div
              className={cn(
                "flex w-full flex-col items-center",
                introVisible ? "gap-6" : "gap-0",
                projectsView ? "pointer-events-none" : "pointer-events-auto",
              )}
            >
              <h1
                aria-label={welcomeFull}
                className="w-full text-center font-serif text-[14px] italic leading-[1.3] text-foreground"
              >
                {!typingDone ? (
                  <>
                    <span aria-hidden="true">{typed}</span>
                    <span
                      aria-hidden="true"
                      className="animate-caret ml-0.5 inline-block h-[0.9em] w-[1.5px] translate-y-[1px] bg-current align-middle"
                    />
                  </>
                ) : revealKey > 0 ? (
                  <ScrambleText
                    key={`welcome-scramble-${revealKey}-${welcomeFull}`}
                    text={welcomeFull}
                    scramble
                    durationMs={620}
                    tickMs={48}
                    maxSwapsPerChar={2}
                  />
                ) : (
                  <span aria-hidden="true">{welcomeFull}</span>
                )}
              </h1>

              <div
                className={cn(
                  "grid w-full",
                  "transition-[grid-template-rows] duration-[1200ms] ease-[cubic-bezier(0.33,1,0.68,1)]",
                  "motion-reduce:transition-none",
                  introVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className={cn(
                      "space-y-5 text-pretty break-words text-center font-serif text-[14px] font-light leading-[1.6] tracking-[-0.02em] text-muted-foreground",
                      introVisible ? "opacity-100" : "opacity-0",
                    )}
                    style={{
                      minHeight: introMinHeight
                        ? `${introMinHeight}px`
                        : undefined,
                      transition: prefersReducedMotion
                        ? "opacity 1000ms ease-out"
                        : `min-height ${introHeightMotion.durationMs}ms ${introHeightMotion.easing}, opacity 1000ms ease-out`,
                    }}
                  >
                    {dictionary.intro.map((paragraph, idx) => (
                      <p key={idx}>{renderIntro(paragraph, idx)}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <nav
              className={cn(
                navContainerClass,
                "pointer-events-auto relative z-20",
              )}
            >
              {renderNavButtons({ scope: "hero" })}
            </nav>
          </div>
        </div>

        <section
          id="design"
          aria-hidden={!projectsView || !projectNavReadyForGrid}
          className={cn(
            "absolute inset-0 z-30 flex min-h-0 flex-col bg-background",
            navItemPhase === "entering" ||
              navItemPhase === "entered"
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0",
          )}
          style={{ transition: "opacity 0ms" }}
        >
          <div
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 [scrollbar-gutter:stable] motion-reduce:scroll-auto"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 3.25rem)",
              paddingBottom: projectsView
                ? Math.max(projectNavBlockPx, 48)
                : 0,
            }}
          >
            <div className="mx-auto flex w-full max-w-[min(100%,120rem)] flex-col gap-3">
              {[0, 1, 2].map((row) => (
                <div
                  key={`row-${row}`}
                  className="grid shrink-0 grid-cols-3 gap-3"
                >
                  {projects.slice(row * 3, row * 3 + 3).map((p, col) => {
                    const lastRowIdx = 2;
                    const isTopLeft = row === 0 && col === 0;
                    const isTopRight = row === 0 && col === 2;
                    const isBottomLeft = row === lastRowIdx && col === 0;
                    const isBottomRight = row === lastRowIdx && col === 2;
                    const bottomToTopI = (2 - row) * 3 + col;
                    const cardIn =
                      projectNavReadyForGrid &&
                      (prefersReducedMotion || projectCardsRevealed);
                    return (
                      <a
                        key={p.id}
                        href={`#${p.id}`}
                        className={cn(
                          "group relative min-h-0 w-full overflow-hidden bg-cover bg-center",
                          "aspect-[464/320] motion-reduce:transition-none",
                          "hover:opacity-[0.92]",
                          cardIn
                            ? "translate-y-0 opacity-100"
                            : "translate-y-7 opacity-0",
                        )}
                        style={{
                          backgroundImage: `url(${p.image})`,
                          borderTopLeftRadius: isTopLeft ? 8 : undefined,
                          borderTopRightRadius: isTopRight ? 8 : undefined,
                          borderBottomLeftRadius: isBottomLeft ? 8 : undefined,
                          borderBottomRightRadius: isBottomRight ? 8 : undefined,
                          transition: `transform ${PROJECT_CARD_DURATION_MS}ms ${PROJECT_CARD_EASE}, opacity ${PROJECT_CARD_DURATION_MS}ms ${PROJECT_CARD_EASE}`,
                          transitionDelay:
                            projectNavReadyForGrid &&
                            projectCardsRevealed &&
                            !prefersReducedMotion
                              ? `${bottomToTopI * PROJECT_CARD_STAGGER_MS}ms`
                              : "0ms",
                        }}
                      >
                        <span className="sr-only">{p.title}</span>
                      </a>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <nav
            ref={bottomNavRef}
            className={cn(
              navContainerClass,
              "fixed inset-x-0 bottom-0 z-30 pointer-events-auto",
            )}
          >
            {renderNavButtons({ scope: "bottom" })}
          </nav>
        </section>
      </main>

      {/* Medição invisível (PT/EN) para animar min-height só do idioma ativo e manter o hero recentralizado. */}
      {introVisible && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] top-0 w-full max-w-[20rem]"
          style={{ visibility: "hidden" }}
        >
          <div
            ref={measurePtRef}
            className="space-y-5 text-pretty break-words text-center font-serif text-[14px] font-light leading-[1.6] tracking-[-0.02em] text-muted-foreground"
          >
            {dictionaries.pt.intro.map((p, idx) => (
              <p key={`pt-${idx}`}>{renderIntroStatic(p, idx)}</p>
            ))}
          </div>
          <div
            ref={measureEnRef}
            className="space-y-5 text-pretty break-words text-center font-serif text-[14px] font-light leading-[1.6] tracking-[-0.02em] text-muted-foreground"
          >
            {dictionaries.en.intro.map((p, idx) => (
              <p key={`en-${idx}`}>{renderIntroStatic(p, idx)}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
