"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrambleText } from "@/components/scramble-text";
import { useLanguage } from "@/components/providers/language-provider";
import { dictionaries } from "@/lib/i18n";

const TYPE_SPEED_INITIAL_MS = 90;
const TYPE_SPEED_QUICK_MS = 38;
const POST_TYPE_HOLD_INITIAL_MS = 320;
const POST_TYPE_HOLD_QUICK_MS = 180;
const DRAMATIC_PAUSE_MS = 1050;
const INTRO_REVEAL_DELAY_MS = POST_TYPE_HOLD_INITIAL_MS + DRAMATIC_PAUSE_MS;
const CHROME_REVEAL_DELAY_MS = INTRO_REVEAL_DELAY_MS + 700;

export default function Home() {
  const { dictionary, toggleLocale, ready: languageReady } = useLanguage();
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
  const [revealKey, setRevealKey] = React.useState(0);
  const prevWelcomeRef = React.useRef<string | null>(null);
  const hasTypedWelcomeOnceRef = React.useRef(false);

  const expandingRef = React.useRef<HTMLDivElement | null>(null);
  const [introMinHeight, setIntroMinHeight] = React.useState<number | null>(null);
  const measurePtRef = React.useRef<HTMLDivElement | null>(null);
  const measureEnRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!languageReady) return;

    const isLocaleChange =
      prevWelcomeRef.current !== null &&
      prevWelcomeRef.current !== welcomeFull;
    prevWelcomeRef.current = welcomeFull;

    if (isLocaleChange) {
      setRevealKey((k) => k + 1);
    }

    // Welcome typewriter should happen only once (first time on screen).
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
    { label: dictionary.sections.design, href: "#design" },
    { label: dictionary.sections.dev, href: "#dev" },
    { label: dictionary.sections.about, href: "#sobre" },
    { label: dictionary.sections.cv, href: "#cv" },
  ];

  // Scramble should happen only on locale changes (not on initial reveal).
  const shouldScrambleOnThisRender = revealKey > 0;

  // Pre-measure PT/EN intro heights and lock to the max.
  React.useLayoutEffect(() => {
    if (!introVisible) return;
    const pt = measurePtRef.current?.getBoundingClientRect().height ?? 0;
    const en = measureEnRef.current?.getBoundingClientRect().height ?? 0;
    const next = Math.ceil(Math.max(pt, en));
    if (next > 0) setIntroMinHeight(next);
  }, [introVisible]);

  const renderIntro = React.useCallback(
    (text: string, idx: number) => {
      const parts = text.split(/(\{UPM\}|\{SME\})/g);

      return (
        <>
          {(() => {
            const out: React.ReactNode[] = [];
            for (let i = 0; i < parts.length; i += 1) {
              const part = parts[i] ?? "";

              const maybeConsumeLeadingPunctuation = () => {
                const next = parts[i + 1] ?? "";
                // If the next chunk starts with punctuation, keep it attached to this token.
                const m = next.match(/^([,.;:!?]+)/);
                if (!m) return null;
                const punct = m[1] ?? "";
                parts[i + 1] = next.slice(punct.length);
                return punct;
              };

              if (part === "{UPM}") {
                const punct = maybeConsumeLeadingPunctuation();
                out.push(
                  <span key={`upm-wrap-${idx}-${i}`} className="whitespace-nowrap">
                    <Button
                      asChild
                      variant="link"
                      size="xs"
                      className={cn(
                        "h-auto p-0 font-serif text-[14px] font-light leading-[1.55] tracking-[-0.02em] text-muted-foreground",
                        "decoration-muted-foreground/40 underline-offset-[3px] hover:text-foreground",
                      )}
                    >
                      <a
                        href="https://www.mackenzie.br/"
                        target="_blank"
                        rel="noreferrer"
                      >
                        UPM
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
                  <span key={`sme-wrap-${idx}-${i}`} className="whitespace-nowrap">
                    <Button
                      asChild
                      variant="link"
                      size="xs"
                      className={cn(
                        "h-auto p-0 font-serif text-[14px] font-light leading-[1.55] tracking-[-0.02em] text-muted-foreground",
                        "decoration-muted-foreground/40 underline-offset-[3px] hover:text-foreground",
                      )}
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
    [revealKey, shouldScrambleOnThisRender],
  );

  const renderIntroStatic = React.useCallback((text: string, idx: number) => {
    const parts = text.split(/(\{UPM\}|\{SME\})/g);
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
                <span key={`m-upm-wrap-${idx}-${i}`} className="whitespace-nowrap">
                  <Button
                    asChild
                    variant="link"
                    size="xs"
                    className={cn(
                      "h-auto p-0 font-serif text-[14px] font-light leading-[1.55] tracking-[-0.02em] text-muted-foreground",
                      "decoration-muted-foreground/40 underline-offset-[3px] hover:text-foreground",
                    )}
                  >
                    <a
                      href="https://www.mackenzie.br/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      UPM
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
                <span key={`m-sme-wrap-${idx}-${i}`} className="whitespace-nowrap">
                  <Button
                    asChild
                    variant="link"
                    size="xs"
                    className={cn(
                      "h-auto p-0 font-serif text-[14px] font-light leading-[1.55] tracking-[-0.02em] text-muted-foreground",
                      "decoration-muted-foreground/40 underline-offset-[3px] hover:text-foreground",
                    )}
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

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header
        className={cn(
          "flex w-full items-center justify-between px-6 pt-6",
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

      <main className="flex flex-1 items-center justify-center px-6">
        <section className="flex w-[300px] flex-col items-center">
          <h1
            aria-label={welcomeFull}
            className="font-serif text-[14px] italic leading-[1.3] text-foreground"
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
              "transition-[grid-template-rows,margin-top] duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]",
              "motion-reduce:transition-none",
              introVisible
                ? "mt-6 grid-rows-[1fr]"
                : "mt-0 grid-rows-[0fr]",
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div
                ref={expandingRef}
                className={cn(
                  "flex flex-col items-center gap-6",
                  "motion-reduce:transition-none",
                )}
                style={{
                  overflow: "hidden",
                }}
              >
                <div
                  className={cn(
                    "space-y-5 text-balance text-center font-serif text-[14px] font-light leading-[1.55] tracking-[-0.02em] text-muted-foreground",
                    "transition-opacity duration-[1000ms] ease-out motion-reduce:transition-none",
                    introVisible ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    minHeight: introMinHeight ? `${introMinHeight}px` : undefined,
                  }}
                >
                  {dictionary.intro.map((paragraph, idx) => (
                    <p key={idx}>
                      {renderIntro(paragraph, idx)}
                    </p>
                  ))}
                </div>

                <nav className="flex w-full items-center justify-center">
                  {sections.map((section, idx) => (
                    <div
                      key={section.href}
                      className={cn(
                        "flex-1",
                        "transition-all duration-700 ease-out motion-reduce:transition-none",
                        chromeVisible
                          ? "translate-y-0 opacity-100"
                          : "translate-y-2 opacity-0",
                      )}
                      style={{
                        transitionDelay: chromeVisible
                          ? `${idx * 130}ms`
                          : "0ms",
                      }}
                    >
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="w-full font-mono text-[12px] tracking-wide"
                      >
                        <a href={section.href}>
                          {section.label}
                        </a>
                      </Button>
                    </div>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Hidden measurement to avoid height jumping on locale swap */}
      {introVisible && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-9999px] top-0 w-[300px]"
          style={{ visibility: "hidden" }}
        >
          <div
            ref={measurePtRef}
            className="space-y-5 text-balance text-center font-serif text-[14px] font-light leading-[1.55] tracking-[-0.02em] text-muted-foreground"
          >
            {dictionaries.pt.intro.map((p, idx) => (
              <p key={`pt-${idx}`}>{renderIntroStatic(p, idx)}</p>
            ))}
          </div>
          <div
            ref={measureEnRef}
            className="space-y-5 text-balance text-center font-serif text-[14px] font-light leading-[1.55] tracking-[-0.02em] text-muted-foreground"
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
