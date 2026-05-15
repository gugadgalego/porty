"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MagneticNavUl } from "@/components/magnetic-nav-ul";
import { useLanguage } from "@/components/providers/language-provider";
import {
  SITE_BOTTOM_NAV_BUTTON_CLASS,
  SITE_BOTTOM_NAV_CONTAINER_CLASS,
  SITE_BOTTOM_NAV_FIXED_SHELL_CLASS,
  SITE_BOTTOM_NAV_ITEM_CLASS,
  SITE_BOTTOM_NAV_LAYER_CLASS,
} from "@/components/site-bottom-nav";
import {
  PORTFOLIO_NAV_HERO_EXIT_DURATION_MS,
  PORTFOLIO_NAV_HERO_EXIT_EASE,
  PORTFOLIO_NAV_ROUTE_TO_DESIGN_KEY,
  SITE_BOTTOM_NAV_DURATION_MS,
  SITE_BOTTOM_NAV_EASE,
  SITE_BOTTOM_NAV_STAGGER_MS,
  portfolioNavEnterSequenceMs,
  portfolioNavExitGateMs,
} from "@/lib/site-bottom-nav-motion";
import { isChromeReady, subscribeChromeReady } from "@/lib/ui-chrome";
import { cn } from "@/lib/utils";

const ITEM_COUNT = 4;

function wantBottomNav(pathname: string): boolean {
  return pathname === "/sobre" || pathname.startsWith("/design/");
}

type Anim = "rest" | "in" | "out";

/**
 * Barra inferior fixa em `/sobre` e `/design/*`.
 * Reutiliza a coreografia da home ao abrir Design:
 * saída em fade direita→esquerda, depois entrada em fade esquerda→direita.
 */
export function AppSiteBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { dictionary, locale } = useLanguage();
  const want = wantBottomNav(pathname);

  const [chromeOk, setChromeOk] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const [anim, setAnim] = React.useState<Anim>("rest");
  const [inArmed, setInArmed] = React.useState(false);

  const timersRef = React.useRef<number[]>([]);
  const reducedRef = React.useRef(false);
  const prevPathnameRef = React.useRef<string | null>(null);
  const transitionRunRef = React.useRef(0);
  const enterAfterNavigationRef = React.useRef(false);

  const sections = React.useMemo(
    () => [
      { label: dictionary.sections.design, href: "/?view=design#design" },
      { label: dictionary.sections.dev, href: "/#dev" },
      { label: dictionary.sections.about, href: "/sobre" },
      { label: dictionary.sections.cv, href: "/#cv" },
    ],
    [dictionary.sections],
  );

  const clearTimers = React.useCallback(() => {
    transitionRunRef.current += 1;
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  React.useEffect(
    () => () => {
      clearTimers();
    },
    [clearTimers],
  );

  React.useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  /** Gate do chrome: um único subscribe — evita Strict Mode a remover o listener antes do `markChromeReady`. */
  React.useEffect(() => {
    if (isChromeReady()) {
      setChromeOk(true);
      return;
    }
    return subscribeChromeReady(() => {
      setChromeOk(true);
    });
  }, []);

  const runEnter = React.useCallback(() => {
    clearTimers();
    if (reducedRef.current) {
      setAnim("rest");
      setInArmed(true);
      return;
    }
    setAnim("in");
    setInArmed(false);
  }, [clearTimers]);

  React.useEffect(() => {
    if (!mounted || anim !== "in" || inArmed || reducedRef.current) return;

    const runId = transitionRunRef.current;
    let raf0 = 0;
    let raf1 = 0;

    raf0 = window.requestAnimationFrame(() => {
      raf1 = window.requestAnimationFrame(() => {
        if (transitionRunRef.current !== runId) return;
        setInArmed(true);

        const total = portfolioNavEnterSequenceMs(ITEM_COUNT);
        const id = window.setTimeout(() => {
          if (transitionRunRef.current !== runId) return;
          setAnim("rest");
          setInArmed(true);
        }, total);
        timersRef.current.push(id);
      });
    });

    return () => {
      window.cancelAnimationFrame(raf0);
      window.cancelAnimationFrame(raf1);
    };
  }, [mounted, anim, inArmed]);

  const runExitThen = React.useCallback(
    (then: () => void) => {
      clearTimers();
      const runId = transitionRunRef.current;
      if (reducedRef.current) {
        then();
        return;
      }
      setAnim("out");
      const gate = portfolioNavExitGateMs(ITEM_COUNT);
      const id = window.setTimeout(() => {
        if (transitionRunRef.current !== runId) return;
        then();
      }, gate);
      timersRef.current.push(id);
    },
    [clearTimers],
  );

  const navigateAfterExit = React.useCallback(
    (href: string) => {
      runExitThen(() => {
        let targetPathname = href;
        let targetHref = href;

        if (typeof window !== "undefined") {
          const url = new URL(href, window.location.href);
          targetPathname = url.pathname;
          targetHref = `${url.pathname}${url.search}${url.hash}`;

          if (url.pathname === "/" && url.hash === "#design") {
            window.sessionStorage.setItem(
              PORTFOLIO_NAV_ROUTE_TO_DESIGN_KEY,
              "1",
            );
          }
        }

        if (wantBottomNav(targetPathname)) {
          enterAfterNavigationRef.current = true;
        } else {
          setMounted(false);
          setAnim("rest");
          setInArmed(true);
        }

        router.push(targetHref);
      });
    },
    [router, runExitThen],
  );

  const handleNavClick = React.useCallback(
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

      const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      const nextHref = `${url.pathname}${url.search}${url.hash}`;
      if (nextHref === currentHref) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      navigateAfterExit(nextHref);
    },
    [navigateAfterExit],
  );

  React.useEffect(() => {
    if (!chromeOk) return;

    const prev = prevPathnameRef.current;

    if (!want) {
      if (mounted) {
        runExitThen(() => {
          setMounted(false);
          setAnim("rest");
          setInArmed(true);
        });
      }
    } else if (!mounted) {
      setMounted(true);
      if (reducedRef.current) {
        setAnim("rest");
        setInArmed(true);
      } else {
        setAnim("rest");
        setInArmed(true);
        runEnter();
      }
    } else if (
      mounted &&
      want &&
      prev !== null &&
      prev !== pathname
    ) {
      if (enterAfterNavigationRef.current) {
        enterAfterNavigationRef.current = false;
        runEnter();
      } else {
        clearTimers();
        setAnim("rest");
        setInArmed(true);
      }
    }

    prevPathnameRef.current = pathname;
  }, [pathname, want, mounted, chromeOk, runEnter, runExitThen, clearTimers]);

  if (!mounted) return null;

  const lastI = sections.length - 1;

  return (
    <nav
      key={locale}
      aria-label="Secções do site"
      className={cn(
        SITE_BOTTOM_NAV_FIXED_SHELL_CLASS,
        "fixed inset-x-0 bottom-0 pointer-events-auto",
        SITE_BOTTOM_NAV_LAYER_CLASS,
        anim === "out" && "pointer-events-none",
      )}
    >
      <MagneticNavUl
        className={SITE_BOTTOM_NAV_CONTAINER_CLASS}
        magnetEnabled={anim === "rest"}
      >
        {sections.map((s, idx) => {
          let opacity = 1;
          let transform = "translate3d(0, 0, 0)";
          let filter = "blur(0)";
          let delayMs = 0;
          let transitionProps: React.CSSProperties;

          if (anim === "out") {
            opacity = 0;
            transform = "translate3d(0, 0, 0)";
            filter = "blur(0)";
            delayMs = (lastI - idx) * SITE_BOTTOM_NAV_STAGGER_MS;
            const d = `${PORTFOLIO_NAV_HERO_EXIT_DURATION_MS}ms`;
            const ease = PORTFOLIO_NAV_HERO_EXIT_EASE;
            const delay = `${delayMs}ms`;
            transitionProps = {
              transitionProperty: "opacity, transform, filter",
              transitionDuration: `${d}, ${d}, ${d}`,
              transitionTimingFunction: `${ease}, ${ease}, ${ease}`,
              transitionDelay: `${delay}, ${delay}, ${delay}`,
            };
          } else if (anim === "in") {
            filter = "blur(0)";
            const d = `${SITE_BOTTOM_NAV_DURATION_MS}ms`;
            const ease = SITE_BOTTOM_NAV_EASE;
            if (!inArmed) {
              opacity = 0;
              transform = "translate3d(0, 0, 0)";
              delayMs = 0;
            } else {
              opacity = 1;
              transform = "translate3d(0, 0, 0)";
              delayMs = idx * SITE_BOTTOM_NAV_STAGGER_MS;
            }
            const delay = `${delayMs}ms`;
            transitionProps = {
              transitionProperty: "opacity, transform",
              transitionDuration: `${d}, ${d}`,
              transitionTimingFunction: `${ease}, ${ease}`,
              transitionDelay: `${delay}, ${delay}`,
            };
          } else {
            filter = "blur(0)";
            transitionProps = {
              transitionProperty: "none",
              transitionDuration: "0s",
              transitionTimingFunction: "ease",
              transitionDelay: "0s",
            };
          }

          return (
            <li
              key={s.href}
              className={SITE_BOTTOM_NAV_ITEM_CLASS}
              style={{
                opacity,
                transform,
                filter,
                ...transitionProps,
              }}
            >
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={SITE_BOTTOM_NAV_BUTTON_CLASS}
              >
                <Link
                  href={s.href}
                  onClick={(event) => handleNavClick(event, s.href)}
                >
                  {s.label}
                </Link>
              </Button>
            </li>
          );
        })}
      </MagneticNavUl>
    </nav>
  );
}
