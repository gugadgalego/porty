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

/** FLIP da nav (Design): um pouco mais ágil que 1100ms. */
const NAV_TRANSITION_MS = 700;
/** Curva mais suave (acelera e desacelera devagar). */
const NAV_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
/** Grelha de projetos: entrada em cascata (baixo → cima, um a um). */
const PROJECT_CARD_STAGGER_MS = 70;
const PROJECT_CARD_DURATION_MS = 420;
const PROJECT_CARD_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
/** Transição de altura do bloco de intro (troca de idioma / re-medida) + a nav acompanha no fluxo. */
const INTRO_MIN_HEIGHT_MS = 520;
const INTRO_BLOCK_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";

type NavBox = { top: number; left: number; width: number; height: number };

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

  const mainRef = React.useRef<HTMLElement | null>(null);
  const navRef = React.useRef<HTMLElement | null>(null);
  /** FLIP: retângulo na home (fluxo) antes de ir para o rodapé. */
  const [navFlipFrom, setNavFlipFrom] = React.useState<NavBox | null>(null);
  /** FLIP: retângulo alvo no rodapé (após rAF). */
  const [navAnimTarget, setNavAnimTarget] = React.useState<NavBox | null>(null);
  /** Depois da transição: `fixed` com bottom/left/right (estável no resize). */
  const [projectNavDocked, setProjectNavDocked] = React.useState(false);
  /** Altura medida da barra fixa; padding do scroll = isto, para o conteúdo nunca passar “por baixo” da nav. */
  const [projectNavBlockPx, setProjectNavBlockPx] = React.useState(0);
  /** Após 1 rAF, dispara a cascata dos cartões (só com nav já encostada). */
  const [projectCardsRevealed, setProjectCardsRevealed] = React.useState(false);

  React.useEffect(() => {
    if (!projectNavDocked) {
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
  }, [projectNavDocked, prefersReducedMotion]);

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

  React.useLayoutEffect(() => {
    if (!introVisible) return;
    const pt = measurePtRef.current?.getBoundingClientRect().height ?? 0;
    const en = measureEnRef.current?.getBoundingClientRect().height ?? 0;
    const next = Math.ceil(Math.max(pt, en));
    if (next > 0) setIntroMinHeight(next);
  }, [introVisible, locale]);

  /** Ao sair de Projetos (futuro) ou forçar reset, limpa o FLIP. */
  React.useEffect(() => {
    if (projectsView) return;
    setNavFlipFrom(null);
    setNavAnimTarget(null);
    setProjectNavDocked(false);
    setProjectNavBlockPx(0);
  }, [projectsView]);

  /** Mede a altura real da barra (incl. safe area) → scroll não passa visível abaixo dela. */
  React.useEffect(() => {
    if (!projectNavDocked) {
      setProjectNavBlockPx(0);
      return;
    }
    const nav = navRef.current;
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
  }, [projectNavDocked]);

  /** FLIP: pinta 1x em `from`, no frame seguinte aplica alvo com transition. */
  React.useEffect(() => {
    if (!projectsView || !navFlipFrom || navAnimTarget || projectNavDocked) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        const main = mainRef.current;
        const nav = navRef.current;
        if (!main || !nav) return;
        const m = main.getBoundingClientRect();
        const navH = nav.offsetHeight || navFlipFrom.height;
        // Barra a largura do main, encostada ao fundo (sem insets; padding nos botões via classe).
        const toW = m.width;
        const toL = m.left;
        const toTop = m.bottom - navH;
        setNavAnimTarget({
          top: toTop,
          left: toL,
          width: toW,
          height: navH,
        });
      });
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(id);
    };
  }, [projectsView, navFlipFrom, navAnimTarget, projectNavDocked]);

  /** Conclui o FLIP e amarra a nav no rodapé. */
  React.useEffect(() => {
    if (!navAnimTarget || projectNavDocked) return;
    const t = window.setTimeout(() => {
      setProjectNavDocked(true);
      setNavAnimTarget(null);
      setNavFlipFrom(null);
    }, NAV_TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [navAnimTarget, projectNavDocked]);

  const handleDesignClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (projectsView) return;
      const nav = navRef.current;
      if (!nav) return;
      const r = nav.getBoundingClientRect();
      const box: NavBox = {
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      };
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        setProjectsView(true);
        setProjectNavDocked(true);
        return;
      }
      setNavFlipFrom(box);
      setProjectsView(true);
    },
    [projectsView],
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

  const projectNavStyle = React.useMemo((): React.CSSProperties => {
    if (!projectsView) return {};
    if (projectNavDocked) {
      return {
        position: "fixed",
        zIndex: 30,
        left: 0,
        right: 0,
        bottom: 0,
        top: "auto",
        width: "100%",
        maxWidth: "100%",
        margin: 0,
      };
    }
    if (navAnimTarget) {
      return {
        position: "fixed",
        zIndex: 30,
        top: navAnimTarget.top,
        left: navAnimTarget.left,
        width: navAnimTarget.width,
        margin: 0,
        transition: `top ${NAV_TRANSITION_MS}ms ${NAV_EASE}, left ${NAV_TRANSITION_MS}ms ${NAV_EASE}, width ${NAV_TRANSITION_MS}ms ${NAV_EASE}`,
      };
    }
    if (navFlipFrom) {
      return {
        position: "fixed",
        zIndex: 30,
        top: navFlipFrom.top,
        left: navFlipFrom.left,
        width: navFlipFrom.width,
        margin: 0,
        transition: "none",
      };
    }
    return {};
  }, [projectsView, projectNavDocked, navAnimTarget, navFlipFrom]);

  return (
    <div className="flex h-svh min-h-0 flex-col overflow-hidden bg-background">
      <header
        className={cn(
          "relative z-20 flex w-full items-center justify-between px-3 pt-3",
          "transition-all duration-700 ease-out motion-reduce:transition-none",
          chromeVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-1 opacity-0",
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

      <main
        ref={mainRef}
        className="relative flex min-h-0 flex-1 flex-col"
      >
        {/* HERO: intro some com o fade; nav no fluxo (gap-6 = 24px) e FLIP até o rodapé */}
        <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-6 [scrollbar-gutter:stable]">
          <div
            className="flex w-full max-w-[20rem] flex-col items-center gap-6 py-6"
            style={{
              paddingTop: "max(0.5rem, calc(50svh - 12rem))",
            }}
          >
            <div
              className={cn(
                "pointer-events-auto w-full",
                "transition-[opacity,transform,filter] duration-500 ease-out motion-reduce:transition-none",
                projectsView
                  ? "pointer-events-none opacity-0 -translate-y-2 blur-[1px]"
                  : "opacity-100 translate-y-0 blur-0",
              )}
              aria-hidden={projectsView}
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
                  "transition-[grid-template-rows,margin-top] duration-[1200ms] ease-[cubic-bezier(0.33,1,0.68,1)]",
                  "motion-reduce:transition-none",
                  introVisible ? "mt-6 grid-rows-[1fr]" : "mt-0 grid-rows-[0fr]",
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
                        : `min-height ${INTRO_MIN_HEIGHT_MS}ms ${INTRO_BLOCK_EASE}, opacity 1000ms ease-out`,
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
              ref={navRef}
              className={cn(
                "pointer-events-auto flex w-full items-stretch justify-center",
                !projectsView && "relative z-20",
                projectsView && "z-20 bg-background",
                projectsView &&
                  "px-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1.5",
              )}
              style={projectNavStyle}
            >
              {sections.map((section, idx) => (
                <div
                  key={section.href}
                  className={cn(
                    "flex-1",
                    "transition-[transform,opacity] duration-700 ease-out motion-reduce:transition-none",
                    chromeVisible
                      ? "translate-y-0 opacity-100"
                      : "translate-y-2 opacity-0",
                  )}
                  style={{
                    transitionDelay: chromeVisible ? `${idx * 130}ms` : "0ms",
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
                      onClick={section.isProjects ? handleDesignClick : undefined}
                    >
                      {section.label}
                    </a>
                  </Button>
                </div>
              ))}
            </nav>
          </div>
        </div>

        <section
          id="design"
          aria-hidden={!projectsView || !projectNavDocked}
          className={cn(
            "absolute inset-0 z-0 flex min-h-0 flex-col will-change-transform",
            "transition-[transform,opacity] ease-[cubic-bezier(0.33,1,0.68,1)]",
            !projectsView && "pointer-events-none translate-y-6 opacity-0 duration-0",
            projectsView &&
              !projectNavDocked &&
              "pointer-events-none translate-y-full opacity-0 duration-0",
            projectsView &&
              projectNavDocked &&
              "pointer-events-auto translate-y-0 opacity-100 duration-[480ms]",
            "motion-reduce:duration-0",
          )}
        >
          <div
            className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 pt-3 [scrollbar-gutter:stable] motion-reduce:scroll-auto"
            style={{
              paddingBottom: projectNavDocked
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
                    const isFirstRowFirst = row === 0 && col === 0;
                    const isFirstRowLast = row === 0 && col === 2;
                    const bottomToTopI = (2 - row) * 3 + col;
                    const cardIn =
                      projectNavDocked &&
                      (prefersReducedMotion || projectCardsRevealed);
                    return (
                      <a
                        key={p.id}
                        href={`#${p.id}`}
                        className={cn(
                          "group relative min-h-0 w-full overflow-hidden bg-cover bg-center",
                          "aspect-[464/320] motion-reduce:transition-none",
                          "hover:opacity-[0.92]",
                          isFirstRowFirst && "rounded-tl-sm",
                          isFirstRowLast && "rounded-tr-md",
                          cardIn
                            ? "translate-y-0 opacity-100"
                            : "translate-y-7 opacity-0",
                        )}
                        style={{
                          backgroundImage: `url(${p.image})`,
                          transition: `transform ${PROJECT_CARD_DURATION_MS}ms ${PROJECT_CARD_EASE}, opacity ${PROJECT_CARD_DURATION_MS}ms ${PROJECT_CARD_EASE}`,
                          transitionDelay:
                            projectNavDocked &&
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
        </section>
      </main>

      {/* Hidden measurement to avoid height jumping on locale swap */}
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
