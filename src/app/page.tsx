"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TypeAnimation } from "react-type-animation";
import { IntroParagraphLocaleWave } from "@/components/intro-paragraph-locale-wave";
import { INTRO_LINK_BUTTON_CLASS } from "@/components/intro-external-link";
import { useLanguage } from "@/components/providers/language-provider";
import { dictionaries } from "@/lib/i18n";
import { getMirrorDictionary } from "@/lib/intro-segments";
import type { PortfolioProject } from "@/lib/portfolio-project";
import {
  PORTFOLIO_HOME_INTRO_SEEN_KEY,
  PORTFOLIO_NAV_ROUTE_TO_DESIGN_KEY,
  SITE_BOTTOM_NAV_DURATION_MS as NAV_ITEM_DURATION_MS,
  SITE_BOTTOM_NAV_STAGGER_MS as NAV_ITEM_STAGGER_MS,
  portfolioNavEnterSequenceMs,
  portfolioNavExitGateMs,
} from "@/lib/site-bottom-nav-motion";
import { markChromeReady } from "@/lib/ui-chrome";
import {
  SITE_BOTTOM_NAV_BUTTON_CLASS,
  SITE_BOTTOM_NAV_CONTAINER_CLASS,
  SITE_BOTTOM_NAV_FIXED_SHELL_CLASS,
  SITE_BOTTOM_NAV_ITEM_CLASS,
  SITE_BOTTOM_NAV_LAYER_CLASS,
} from "@/components/site-bottom-nav";
import { MagneticNavUl } from "@/components/magnetic-nav-ul";

const TYPE_SPEED_INITIAL_MS = 90;
const POST_TYPE_HOLD_INITIAL_MS = 180;
const DRAMATIC_PAUSE_MS = 120;
const INTRO_REVEAL_DELAY_MS = POST_TYPE_HOLD_INITIAL_MS + DRAMATIC_PAUSE_MS;
const CHROME_REVEAL_DELAY_MS = INTRO_REVEAL_DELAY_MS + 360;
/** Respiro depois da nav do hero ficar visível antes de revelar UI secundária (ex.: PullTab). */
const SUPPORTING_UI_AFTER_CHROME_MS = 520;
const ROUTED_DESIGN_ENTER_FRAME_DELAY_MS = 32;

/** Curva mais suave (acelera e desacelera devagar). */
const NAV_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
/** Largura mínima por slot quando existem várias colunas (slots + frames alinham-se a isto). */
const DESIGN_GRID_MIN_SLOT_PX = 464;

function designGridColumnCountForWidth(
  widthPx: number,
  gapPx: number,
  minSlotPx: number,
): number {
  if (widthPx <= 0) return 1;
  let best = 1;
  for (let c = 2; c <= 24; c++) {
    const perSlot = (widthPx - (c - 1) * gapPx) / c;
    if (perSlot >= minSlotPx) best = c;
    else break;
  }
  return best;
}

function takeRouteToDesignNavFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const flagged =
      window.sessionStorage.getItem(PORTFOLIO_NAV_ROUTE_TO_DESIGN_KEY) === "1";
    if (flagged) {
      window.sessionStorage.removeItem(PORTFOLIO_NAV_ROUTE_TO_DESIGN_KEY);
    }
    return flagged;
  } catch {
    return false;
  }
}

function currentUrlWantsDesign(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("view") === "design" || window.location.hash === "#design";
  } catch {
    return window.location.hash === "#design";
  }
}

function wantsDesignFromSearchParams(searchParams: {
  get(name: string): string | null;
}): boolean {
  return searchParams.get("view") === "design" || currentUrlWantsDesign();
}

function hasHomeIntroPlayed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(PORTFOLIO_HOME_INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

function rememberHomeIntroPlayed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PORTFOLIO_HOME_INTRO_SEEN_KEY, "1");
  } catch {
    /* sessionStorage pode estar indisponível */
  }
}
/** Altura do bloco de intro = sempre max(PT, EN) nos refs off-screen — zero shift na troca de idioma / scramble. */
const INTRO_ENTRANCE_DURATION_MS = 560;
const INTRO_ENTRANCE_STAGGER_MS = 92;
const INTRO_ENTRANCE_DELAY_MS = 40;
const INTRO_ENTRANCE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const HERO_NAV_REVEAL_DURATION_MS = 520;
const HERO_NAV_REVEAL_STAGGER_MS = 72;

/** Corpo do intro: stack modular (`gap` = mesmo ritmo que `space-y-5`). */
const INTRO_BODY_STACK_CLASS = cn(
  "flex w-full flex-col gap-5 text-center font-serif text-[14px] font-light leading-[1.65] tracking-[-0.02em] text-muted-foreground [text-wrap:pretty]",
);

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialWantsDesignRef = React.useRef(
    wantsDesignFromSearchParams(searchParams),
  );
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
  const [homeIntroPlayed, setHomeIntroPlayed] =
    React.useState(hasHomeIntroPlayed);
  const [introVisible, setIntroVisible] =
    React.useState(hasHomeIntroPlayed);
  const [chromeVisible, setChromeVisible] =
    React.useState(hasHomeIntroPlayed);
  /** Mantém o mesmo timing que `chromeVisible` nesta branch (intro scramble; sem etapa braille). */
  const [heroNavVisible, setHeroNavVisible] = React.useState(false);
  const [projectsView, setProjectsView] =
    React.useState(initialWantsDesignRef.current);
  const shouldSkipHomeIntro = homeIntroPlayed || projectsView;
  const [routeModeReady, setRouteModeReady] = React.useState(false);
  const [revealKey, setRevealKey] = React.useState(0);
  const prevWelcomeRef = React.useRef<string | null>(null);
  /** Troca PT ↔ EN no welcome após o primeiro typewriter: apagar + redigitar. */
  const [welcomeAnimCycle, setWelcomeAnimCycle] = React.useState(0);
  const [welcomeLocalePair, setWelcomeLocalePair] = React.useState<{
    from: string;
    to: string;
  } | null>(null);

  const [introParagraphHeights, setIntroParagraphHeights] = React.useState<
    number[]
  >([]);
  const [prefersReducedMotion, setPrefersReducedMotion] =
    React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const onChange = () => setPrefersReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const measurePtParaRefs = React.useRef<(HTMLParagraphElement | null)[]>([]);
  const measureEnParaRefs = React.useRef<(HTMLParagraphElement | null)[]>([]);

  const [welcomeTypingComplete, setWelcomeTypingComplete] =
    React.useState(hasHomeIntroPlayed);
  const [frozenWelcomeForTypewriter, setFrozenWelcomeForTypewriter] =
    React.useState<string | null>(null);

  /**
   * Mantém o typewriter alinhado ao locale até terminar a digitação inicial.
   * Antes congelávamos só no primeiro tick — se `dictionary` ainda fosse PT e
   * depois passasse a EN (ex.: reload com `localStorage` em inglês), ficava
   * "Bem-vindo" com o intro já em EN.
   */
  React.useEffect(() => {
    if (!languageReady) return;
    if (shouldSkipHomeIntro) return;
    if (welcomeTypingComplete) return;
    setFrozenWelcomeForTypewriter(dictionary.welcome);
  }, [
    languageReady,
    dictionary.welcome,
    welcomeTypingComplete,
    shouldSkipHomeIntro,
  ]);

  React.useEffect(() => {
    if (!languageReady) return;
    if (shouldSkipHomeIntro) {
      setWelcomeTypingComplete(true);
      return;
    }
    if (prefersReducedMotion) {
      setWelcomeTypingComplete(true);
      return;
    }
    if (welcomeTypingComplete) return;
    if (frozenWelcomeForTypewriter === null) return;
    const ms =
      frozenWelcomeForTypewriter.length * TYPE_SPEED_INITIAL_MS +
      POST_TYPE_HOLD_INITIAL_MS +
      180;
    const id = window.setTimeout(() => setWelcomeTypingComplete(true), ms);
    return () => window.clearTimeout(id);
  }, [
    languageReady,
    prefersReducedMotion,
    welcomeTypingComplete,
    frozenWelcomeForTypewriter,
    shouldSkipHomeIntro,
  ]);

  const bottomNavRef = React.useRef<HTMLElement | null>(null);
  /** Nº de colunas (responsive, min. 464px/slot); `repeat(n,1fr)` + frames invisíveis na última fila. */
  const designGridRef = React.useRef<HTMLDivElement | null>(null);
  const [designGridCols, setDesignGridCols] = React.useState(1);
  const designGridColsRef = React.useRef(designGridCols);
  React.useEffect(() => {
    designGridColsRef.current = designGridCols;
  }, [designGridCols]);
  /** Depois do stagger-in dos botões no rodapé: libera a grid (cascata dos cards). */
  const [projectNavReadyForGrid, setProjectNavReadyForGrid] =
    React.useState(initialWantsDesignRef.current);
  /** Altura medida da barra fixa; padding do scroll = isto, para o conteúdo nunca passar “por baixo” da nav. */
  const [projectNavBlockPx, setProjectNavBlockPx] = React.useState(0);
  const [projects, setProjects] = React.useState<PortfolioProject[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const loadProjects = async () => {
      try {
        const res = await fetch("/api/site/projects", { cache: "no-store" });
        const data = (await res.json()) as { projects?: PortfolioProject[] };
        if (!cancelled && res.ok && Array.isArray(data.projects)) {
          setProjects(data.projects);
        }
      } catch {
        /* mantém lista vazia */
      }
    };
    void loadProjects();
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadProjects();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  /**
   * Coreografia da transição Design:
   *  - idle: home normal
   *  - exiting: hero nav buttons somem (right-to-left)
   *  - entering: bottom nav buttons aparecem (left-to-right)
   *  - entered: grid libera
   */
  const [navItemPhase, setNavItemPhase] = React.useState<
    "idle" | "exiting" | "entering" | "entered"
  >(() => (initialWantsDesignRef.current ? "entered" : "idle"));
  const navTransitionTimersRef = React.useRef<number[]>([]);
  /** Saída do hero antes de `/sobre` (cancelável ao abrir Design). */
  const heroSobreExitArmedRef = React.useRef(false);

  React.useLayoutEffect(() => {
    if (wantsDesignFromSearchParams(searchParams)) {
      setProjectsView(true);
      setProjectNavReadyForGrid(true);
      setNavItemPhase("entered");
    }
    if (hasHomeIntroPlayed()) {
      setHomeIntroPlayed(true);
      setIntroVisible(true);
      setChromeVisible(true);
      setWelcomeTypingComplete(true);
    }
    document.documentElement.classList.remove("porty-home-route-pending");
    setRouteModeReady(true);
  }, [searchParams]);

  const clearNavTransitionTimers = React.useCallback(() => {
    for (const id of navTransitionTimersRef.current) {
      window.clearTimeout(id);
    }
    navTransitionTimersRef.current = [];
    if (heroSobreExitArmedRef.current) {
      heroSobreExitArmedRef.current = false;
      setNavItemPhase("idle");
    }
  }, []);

  React.useLayoutEffect(() => {
    const el = designGridRef.current;
    if (!el) return;
    const read = () => {
      const widthPx = el.getBoundingClientRect().width;
      const gapRaw =
        getComputedStyle(el).columnGap ||
        getComputedStyle(el).gap ||
        "12px";
      const gapPx = Number.parseFloat(gapRaw) || 12;
      const nextCols = designGridColumnCountForWidth(
        widthPx,
        gapPx,
        DESIGN_GRID_MIN_SLOT_PX,
      );
      if (nextCols === designGridColsRef.current) return;

      setDesignGridCols(nextCols);
      designGridColsRef.current = nextCols;
    };
    read();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(read);
    });
    ro.observe(el);
    window.addEventListener("resize", read);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
    };
  }, [projects.length, projectsView, prefersReducedMotion]);

  React.useLayoutEffect(() => {
    if (!languageReady) return;

    const prev = prevWelcomeRef.current;
    const curr = welcomeFull;
    const isLocaleChange = prev !== null && prev !== curr;

    if (isLocaleChange) {
      setRevealKey((k) => k + 1);
      if (welcomeTypingComplete) {
        setWelcomeLocalePair({ from: prev, to: curr });
        setWelcomeAnimCycle((c) => c + 1);
      }
    }

    prevWelcomeRef.current = curr;
  }, [languageReady, welcomeFull, welcomeTypingComplete]);

  React.useEffect(() => {
    if (!languageReady || !welcomeTypingComplete) return;
    if (shouldSkipHomeIntro) {
      setIntroVisible(true);
      setChromeVisible(true);
      return;
    }
    const introT = window.setTimeout(
      () => setIntroVisible(true),
      INTRO_REVEAL_DELAY_MS,
    );
    const chromeT = window.setTimeout(
      () => setChromeVisible(true),
      CHROME_REVEAL_DELAY_MS,
    );
    return () => {
      window.clearTimeout(introT);
      window.clearTimeout(chromeT);
    };
  }, [languageReady, welcomeTypingComplete, shouldSkipHomeIntro]);

  React.useEffect(() => {
    setHeroNavVisible(chromeVisible);
  }, [chromeVisible]);

  React.useEffect(() => {
    if (!chromeVisible || homeIntroPlayed || projectsView) return;
    rememberHomeIntroPlayed();
    setHomeIntroPlayed(true);
  }, [chromeVisible, homeIntroPlayed, projectsView]);

  React.useEffect(() => {
    if (!heroNavVisible) return;
    const id = window.setTimeout(
      () => markChromeReady(),
      SUPPORTING_UI_AFTER_CHROME_MS,
    );
    return () => window.clearTimeout(id);
  }, [heroNavVisible]);

  const sections = [
    { label: dictionary.sections.design, href: "#design", isProjects: true },
    { label: dictionary.sections.dev, href: "#dev", isProjects: false },
    { label: dictionary.sections.about, href: "/sobre", isProjects: false },
    { label: dictionary.sections.cv, href: "#cv", isProjects: false },
  ];

  const shouldScrambleOnThisRender = revealKey > 0;

  const introBlockCount = dictionary.intro.length;
  const paragraphHeightsReady = React.useMemo(() => {
    if (introParagraphHeights.length < introBlockCount) return false;
    return introParagraphHeights
      .slice(0, introBlockCount)
      .every((h) => h > 0);
  }, [introBlockCount, introParagraphHeights]);

  /** Altura mínima acumulada da coluna central (welcome + intro) — não encolhe na troca PT/EN. */
  const heroBodyRef = React.useRef<HTMLDivElement | null>(null);
  const [heroBodyMinPx, setHeroBodyMinPx] = React.useState(0);

  React.useLayoutEffect(() => {
    if (!introVisible) {
      setHeroBodyMinPx(0);
      return;
    }
    const el = heroBodyRef.current;
    if (!el) return;
    const h = Math.ceil(el.getBoundingClientRect().height);
    if (h > 0) {
      setHeroBodyMinPx((prev) => Math.max(prev, h));
    }
  }, [
    introVisible,
    locale,
    dictionary,
    welcomeTypingComplete,
    paragraphHeightsReady,
    introParagraphHeights,
    revealKey,
  ]);

  const handleIntroLocaleToggle = React.useCallback(() => {
    if (!languageReady) return;
    toggleLocale();
  }, [languageReady, toggleLocale]);

  /** Por índice de parágrafo: ceil(max(altura PT, altura EN)) — blocos independentes, layout fixo. */
  React.useLayoutEffect(() => {
    if (!introVisible) return;

    const measure = () => {
      const n = Math.min(
        dictionaries.pt.intro.length,
        dictionaries.en.intro.length,
      );
      const next: number[] = [];
      for (let i = 0; i < n; i += 1) {
        const pt =
          measurePtParaRefs.current[i]?.getBoundingClientRect().height ?? 0;
        const en =
          measureEnParaRefs.current[i]?.getBoundingClientRect().height ?? 0;
        next[i] = Math.ceil(Math.max(pt, en, 1));
      }
      setIntroParagraphHeights(next);
    };

    measure();
    const ro = new ResizeObserver(measure);
    for (const el of measurePtParaRefs.current) {
      if (el) ro.observe(el);
    }
    for (const el of measureEnParaRefs.current) {
      if (el) ro.observe(el);
    }
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [introVisible]);

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

  /**
   * URL canónica para abrir a grelha de projetos na home: `/#design`
   * (links externos, página de projeto, refresh com hash). O botão
   * «Design» no hero continua com `preventDefault` + esta função.
   */
  const openDesignGrid = React.useCallback(() => {
    if (projectsView) return;
    const enteredAfterRouteExit = takeRouteToDesignNavFlag();
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
    setNavItemPhase("exiting");
    setProjectsView(true);

    const count = sections.length;
    const enterDelayMs = enteredAfterRouteExit
      ? ROUTED_DESIGN_ENTER_FRAME_DELAY_MS
      : portfolioNavExitGateMs(count);

    const tEnter = window.setTimeout(() => {
      setNavItemPhase("entering");
      const enterTotalMs = portfolioNavEnterSequenceMs(count);
      const tReady = window.setTimeout(() => {
        setNavItemPhase("entered");
        setProjectNavReadyForGrid(true);
      }, enterTotalMs);
      navTransitionTimersRef.current.push(tReady);
    }, enterDelayMs);
    navTransitionTimersRef.current.push(tEnter);
  }, [projectsView, clearNavTransitionTimers, sections.length]);

  const handleDesignClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      openDesignGrid();
    },
    [openDesignGrid],
  );

  const handleHeroSobreClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (projectsView) return;
      if (prefersReducedMotion) return;
      event.preventDefault();
      clearNavTransitionTimers();
      heroSobreExitArmedRef.current = true;
      setNavItemPhase("exiting");
      const exitTotalMs = portfolioNavExitGateMs(sections.length);
      const id = window.setTimeout(() => {
        heroSobreExitArmedRef.current = false;
        void router.push("/sobre");
      }, exitTotalMs);
      navTransitionTimersRef.current.push(id);
    },
    [
      projectsView,
      prefersReducedMotion,
      clearNavTransitionTimers,
      router,
      sections.length,
    ],
  );

  const handleBottomNavClick = React.useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
        return;
      }

      const target = event.currentTarget.getAttribute("target");
      if (target != null && target !== "_self") return;
      if (typeof window === "undefined") return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;

      event.preventDefault();
      if (url.pathname === "/" && url.hash === "#design") return;

      const targetHref = `${url.pathname}${url.search}${url.hash}`;
      if (prefersReducedMotion) {
        router.push(targetHref);
        return;
      }

      clearNavTransitionTimers();
      setProjectNavReadyForGrid(false);
      setNavItemPhase("exiting");

      const id = window.setTimeout(() => {
        if (url.pathname === "/" && url.hash !== "#design") {
          setProjectsView(false);
          setNavItemPhase("idle");
        }
        router.push(targetHref);
      }, portfolioNavExitGateMs(sections.length));
      navTransitionTimersRef.current.push(id);
    },
    [
      prefersReducedMotion,
      router,
      clearNavTransitionTimers,
      sections.length,
    ],
  );

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const syncHashToDesignGrid = () => {
      if (!wantsDesignFromSearchParams(searchParams)) return;
      openDesignGrid();
    };
    syncHashToDesignGrid();
    window.addEventListener("hashchange", syncHashToDesignGrid);
    return () =>
      window.removeEventListener("hashchange", syncHashToDesignGrid);
  }, [openDesignGrid, searchParams]);

  const renderIntro = React.useCallback(
    (paragraphRaw: string, idx: number) => (
      <IntroParagraphLocaleWave
        paragraphRaw={paragraphRaw}
        paragraphIndex={idx}
        dictionary={dictionary}
        mirrorDict={getMirrorDictionary(locale)}
        shouldScramble={shouldScrambleOnThisRender}
        revealKey={revealKey}
        prefersReducedMotion={prefersReducedMotion}
      />
    ),
    [
      dictionary,
      locale,
      shouldScrambleOnThisRender,
      revealKey,
      prefersReducedMotion,
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
                    className={INTRO_LINK_BUTTON_CLASS}
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
                    className={INTRO_LINK_BUTTON_CLASS}
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
                    className={INTRO_LINK_BUTTON_CLASS}
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
                    className={INTRO_LINK_BUTTON_CLASS}
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
                    className={INTRO_LINK_BUTTON_CLASS}
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

  const navContainerClass = SITE_BOTTOM_NAV_CONTAINER_CLASS;

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
        else opacity = heroNavVisible ? 1 : 0;
      } else {
        if (navItemPhase === "entering" || navItemPhase === "entered") opacity = 1;
        else opacity = 0;
      }

      let delayMs = 0;
      if (isHero) {
        if (navItemPhase === "exiting") {
          delayMs = (lastIdx - idx) * NAV_ITEM_STAGGER_MS;
        } else if (!projectsView) {
          delayMs = heroNavVisible ? idx * HERO_NAV_REVEAL_STAGGER_MS : 0;
        }
      } else {
        if (navItemPhase === "entering") {
          delayMs = idx * NAV_ITEM_STAGGER_MS;
        } else if (navItemPhase === "exiting") {
          delayMs = (lastIdx - idx) * NAV_ITEM_STAGGER_MS;
        }
      }

      const navHidden =
        opacity === 0 &&
        (isHero
          ? navItemPhase !== "exiting"
          : navItemPhase !== "entering" && navItemPhase !== "entered");

      const bottomSlideIn =
        !isHero && opacity === 0 && projectsView && navItemPhase === "entering";

      return (
        <li
          key={`${opts.scope}-${section.href}`}
          className={SITE_BOTTOM_NAV_ITEM_CLASS}
          style={{
            opacity,
            transform: isHero
              ? navHidden
                ? "translate3d(0, 6px, 0)"
                : "translate3d(0, 0, 0)"
              : bottomSlideIn
                ? "translate3d(-14px, 0, 0)"
                : "translate3d(0, 0, 0)",
            filter: isHero && navHidden ? "blur(2px)" : "blur(0)",
            transitionProperty:
              isHero || navItemPhase === "exiting"
                ? "opacity, transform, filter"
                : "opacity, transform",
            transitionDuration:
              isHero || navItemPhase === "exiting"
                ? `${HERO_NAV_REVEAL_DURATION_MS}ms, ${HERO_NAV_REVEAL_DURATION_MS}ms, ${HERO_NAV_REVEAL_DURATION_MS}ms`
                : `${NAV_ITEM_DURATION_MS}ms, ${NAV_ITEM_DURATION_MS}ms`,
            transitionTimingFunction:
              isHero || navItemPhase === "exiting"
                ? `${INTRO_ENTRANCE_EASE}, ${INTRO_ENTRANCE_EASE}, ${INTRO_ENTRANCE_EASE}`
                : `${NAV_EASE}, ${NAV_EASE}`,
            transitionDelay:
              isHero || navItemPhase === "exiting"
                ? `${delayMs}ms, ${delayMs}ms, ${delayMs}ms`
                : `${delayMs}ms, ${delayMs}ms`,
          }}
        >
          <Button
            asChild
            variant="ghost"
            size="sm"
            className={SITE_BOTTOM_NAV_BUTTON_CLASS}
          >
            <a
              href={section.href}
              onClick={
                isHero && section.isProjects
                  ? handleDesignClick
                  : isHero && section.href === "/sobre"
                    ? handleHeroSobreClick
                    : !isHero
                      ? (event) => handleBottomNavClick(event, section.href)
                    : undefined
              }
              tabIndex={isHero ? (projectsView ? -1 : 0) : projectsView ? 0 : -1}
              aria-hidden={isHero ? projectsView : !projectsView}
            >
              {section.label}
            </a>
          </Button>
        </li>
      );
    });
  };

  return (
    <div
      data-porty-home-root
      className={cn(
        "flex h-svh min-h-0 flex-col overflow-hidden bg-background",
        routeModeReady ? "opacity-100" : "opacity-0",
      )}
    >
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-40 flex w-full items-center justify-between bg-background px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] pb-2",
          "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
          chromeVisible
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-1 opacity-0",
          "hidden",
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleIntroLocaleToggle}
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

      <main className="relative flex min-h-0 flex-1 flex-col pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
        {/* HERO: layout totalmente estático. A nav do hero só muda `opacity` dos botões. */}
        <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 [scrollbar-gutter:stable]">
          <div
            className={cn(
              "flex w-full max-w-[20rem] flex-col items-center py-6",
              introVisible ? "gap-6" : "gap-0",
            )}
          >
            <div
              ref={heroBodyRef}
              className={cn(
                "flex w-full flex-col items-center",
                introVisible ? "gap-6" : "gap-0",
                projectsView ? "pointer-events-none" : "pointer-events-auto",
              )}
              style={{
                minHeight: heroBodyMinPx > 0 ? `${heroBodyMinPx}px` : undefined,
              }}
            >
              <h1
                aria-label={welcomeFull}
                className="w-full text-center font-serif text-[14px] italic leading-[1.3] text-foreground"
              >
                {prefersReducedMotion || shouldSkipHomeIntro ? (
                  <span aria-hidden="true">{welcomeFull}</span>
                ) : (
                  <TypeAnimation
                    key={
                      welcomeLocalePair === null
                        ? `welcome-init-${frozenWelcomeForTypewriter ?? dictionary.welcome}`
                        : `welcome-cross-${welcomeAnimCycle}`
                    }
                    sequence={
                      welcomeLocalePair === null
                        ? [frozenWelcomeForTypewriter ?? dictionary.welcome]
                        : [
                            welcomeLocalePair.from,
                            420,
                            welcomeLocalePair.to,
                          ]
                    }
                    wrapper="span"
                    speed={{
                      type: "keyStrokeDelayInMs",
                      value: TYPE_SPEED_INITIAL_MS,
                    }}
                    deletionSpeed={{
                      type: "keyStrokeDelayInMs",
                      value: Math.max(35, TYPE_SPEED_INITIAL_MS - 25),
                    }}
                    cursor
                    repeat={0}
                    preRenderFirstString={welcomeLocalePair !== null}
                    className="inline-block"
                    aria-hidden
                  />
                )}
              </h1>

              <div
                className={cn(
                  "grid w-full",
                  "transition-[grid-template-rows] duration-[640ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  "motion-reduce:transition-none",
                  introVisible ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                )}
              >
                <div className="min-h-0 overflow-hidden">
                  <div
                    className={cn(
                      "w-full shrink-0",
                      introVisible &&
                        !paragraphHeightsReady &&
                        "min-h-[min(50vh,28rem)]",
                    )}
                  >
                    <div
                      className={cn(
                        INTRO_BODY_STACK_CLASS,
                        "pointer-events-auto",
                        "motion-reduce:transition-none",
                      )}
                    >
                      {dictionary.intro.map((paragraph, idx) => (
                        <div
                          key={`intro-block-${idx}`}
                          className="relative w-full shrink-0"
                          style={{
                            minHeight:
                              introParagraphHeights[idx] != null
                                ? `${introParagraphHeights[idx]}px`
                                : undefined,
                          }}
                        >
                          <p
                            lang={locale === "pt" ? "pt-BR" : "en-US"}
                            className="m-0 hyphens-manual text-pretty motion-reduce:transition-none [text-wrap:pretty] break-words"
                            style={{
                              opacity: introVisible ? 1 : 0,
                              transform:
                                introVisible || prefersReducedMotion
                                  ? "translate3d(0, 0, 0)"
                                  : "translate3d(0, 6px, 0)",
                              filter:
                                introVisible || prefersReducedMotion
                                  ? "blur(0)"
                                  : "blur(2px)",
                              transitionProperty: prefersReducedMotion
                                ? "opacity"
                                : "opacity, transform, filter",
                              transitionDuration: prefersReducedMotion
                                ? "260ms"
                                : `${INTRO_ENTRANCE_DURATION_MS}ms, ${INTRO_ENTRANCE_DURATION_MS}ms, ${INTRO_ENTRANCE_DURATION_MS}ms`,
                              transitionTimingFunction: prefersReducedMotion
                                ? "ease-out"
                                : `${INTRO_ENTRANCE_EASE}, ${INTRO_ENTRANCE_EASE}, ${INTRO_ENTRANCE_EASE}`,
                              transitionDelay:
                                introVisible && !prefersReducedMotion
                                  ? `${INTRO_ENTRANCE_DELAY_MS + idx * INTRO_ENTRANCE_STAGGER_MS}ms, ${INTRO_ENTRANCE_DELAY_MS + idx * INTRO_ENTRANCE_STAGGER_MS}ms, ${INTRO_ENTRANCE_DELAY_MS + idx * INTRO_ENTRANCE_STAGGER_MS}ms`
                                  : "0ms",
                            }}
                          >
                            {renderIntro(paragraph, idx)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <nav
              aria-label="Secções do site"
              className="pointer-events-auto relative z-20"
            >
              <MagneticNavUl
                className={navContainerClass}
                magnetEnabled={heroNavVisible && !projectsView}
              >
                {renderNavButtons({ scope: "hero" })}
              </MagneticNavUl>
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
              paddingTop: "max(0.75rem, env(safe-area-inset-top, 0px))",
              paddingBottom: projectsView
                ? Math.max(projectNavBlockPx, 48)
                : 0,
            }}
          >
            <div className="mx-auto flex w-full max-w-[min(100%,120rem)] flex-col gap-3">
              {projects.length === 0 ? (
                <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 py-16 text-center">
                  <p className="max-w-sm font-serif text-lg font-light text-muted-foreground">
                    Ainda não há projetos visíveis na grelha. No CMS confirma
                    título e id, mantém «Implementado / visível no portfólio»
                    ligado e guarda.
                  </p>
                  <p className="font-mono text-[11px] text-muted-foreground/80">
                    Em desenvolvimento o site lê primeiro{" "}
                    <span className="text-foreground">src/data/cms-projects.json</span>
                    . Em produção podes usar{" "}
                    <span className="text-foreground">CMS_PROJECTS_JSON</span>.
                  </p>
                </div>
              ) : (
                (() => {
	                  const gridItems = projects.filter((p) => p?.id?.trim());
	                  const n = gridItems.length;
	                  const gridCols = Math.max(1, designGridCols);
	                  const trailingPlaceholders =
	                    n === 0 ? 0 : (gridCols - (n % gridCols)) % gridCols;

                  return (
                    <div
                      ref={designGridRef}
                      className="grid w-full shrink-0 items-stretch gap-3"
                      style={{
                        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
                      }}
                    >
	                      {gridItems.map((p) => {
                        return (
                          <Link
                            key={p.id}
                            href={`/design/${encodeURIComponent(p.id)}`}
                            prefetch={false}
                            className={cn(
                              "relative block min-h-0 w-full min-w-0 outline-none",
                              "focus-visible:z-10",
                              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            )}
                          >
                            <span className="sr-only">
                              {p.title}
                              {p.subtitle ? ` — ${p.subtitle}` : ""}
                            </span>
                            <div className="relative min-h-[320px] w-full min-w-0 overflow-hidden bg-card">
                              <div className="absolute inset-0 overflow-hidden bg-muted/25">
                                <div
                                  className="absolute inset-0 bg-cover bg-center"
                                  style={{
                                    backgroundImage:
                                      p.image.length > 0
                                        ? `url(${p.image})`
                                        : undefined,
                                  }}
                                  aria-hidden
                                />
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                      {Array.from({ length: trailingPlaceholders }, (_, i) => (
                        <div
                          key={`design-grid-frame-${i}`}
                          aria-hidden
                          role="presentation"
                          className="pointer-events-none invisible min-h-[320px] min-w-0 w-full shrink-0 select-none"
                        />
                      ))}
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        </section>
        {projectsView ? (
          <nav
            ref={bottomNavRef}
            aria-label="Secções do site"
            className={cn(
              SITE_BOTTOM_NAV_FIXED_SHELL_CLASS,
              "fixed inset-x-0 bottom-0 pointer-events-auto",
              SITE_BOTTOM_NAV_LAYER_CLASS,
            )}
          >
            <MagneticNavUl className={navContainerClass} magnetEnabled={projectsView}>
              {renderNavButtons({ scope: "bottom" })}
            </MagneticNavUl>
          </nav>
        ) : null}
      </main>

      {/* Medição invisível (PT/EN) para animar min-height só do idioma ativo e manter o hero recentralizado. */}
      {introVisible && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] top-0 w-full max-w-[20rem]"
          style={{ visibility: "hidden" }}
        >
          <div className={INTRO_BODY_STACK_CLASS}>
            {dictionaries.pt.intro.map((p, idx) => (
              <p
                key={`pt-${idx}`}
                ref={(el) => {
                  measurePtParaRefs.current[idx] = el;
                }}
                className="m-0"
              >
                {renderIntroStatic(p, idx)}
              </p>
            ))}
          </div>
          <div className={INTRO_BODY_STACK_CLASS}>
            {dictionaries.en.intro.map((p, idx) => (
              <p
                key={`en-${idx}`}
                ref={(el) => {
                  measureEnParaRefs.current[idx] = el;
                }}
                className="m-0"
              >
                {renderIntroStatic(p, idx)}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
