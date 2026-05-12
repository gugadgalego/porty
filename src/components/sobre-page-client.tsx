"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChromeReadyMark } from "@/components/chrome-ready-mark";
import { useLanguage } from "@/components/providers/language-provider";
import { SobreExperienciaTimeline } from "@/components/sobre-experiencia-timeline";
import { SobreTvStaticOverlay } from "@/components/sobre-tv-static-overlay";
import { SobreVideoShaderFrame } from "@/components/sobre-video-shader-frame";
import {
  pickRandomSobreVideoUrl,
  pickRandomSobreVideoUrlExcept,
  SOBRE_FALLBACK_VIDEO_URL,
} from "@/lib/sobre-session-video";
import {
  playSobreTvStaticGlitchSound,
  resumeSobreTvAudioContext,
} from "@/lib/sobre-tv-static-sound";
import { cn } from "@/lib/utils";

const SCROLL_START_PX = 10;

/** Duração da estática antes de montar o próximo clip (ms). */
const TV_STATIC_GLITCH_MS = 520;

const FRAME_BOX = cn(
  "relative w-full shrink-0 overflow-hidden rounded-lg [corner-shape:squircle]",
  "aspect-[3/2] max-h-[min(56vh,400px)] min-h-[200px] max-w-[600px]",
  "shadow-[0_6px_8px_rgba(0,0,0,0.2)]",
  "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.4),0_20px_48px_-12px_rgba(0,0,0,0.85),0_12px_24px_-8px_rgba(0,0,0,0.65)]",
);

export function SobrePageClient() {
  const { dictionary } = useLanguage();
  const [videoCandidates, setVideoCandidates] = useState<string[]>([]);
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [staticGlitch, setStaticGlitch] = useState(false);
  const clipTransitionRef = useRef(false);
  const [scrollAtten, setScrollAtten] = useState(0);
  const [scrollStarted, setScrollStarted] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [captionOn, setCaptionOn] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const captionTimerRef = useRef<number | null>(null);

  const onMediaReady = useCallback(() => {
    setMediaReady(true);
  }, []);

  const glitchTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (glitchTimerRef.current != null) {
        window.clearTimeout(glitchTimerRef.current);
        glitchTimerRef.current = null;
      }
      clipTransitionRef.current = false;
    },
    [],
  );

  const handleClipEnded = useCallback(() => {
    if (videoCandidates.length < 2) return;
    if (clipTransitionRef.current) return;
    clipTransitionRef.current = true;

    const swap = () => {
      setVideoSrc((cur) =>
        cur
          ? pickRandomSobreVideoUrlExcept(videoCandidates, cur)
          : pickRandomSobreVideoUrl(videoCandidates),
      );
      clipTransitionRef.current = false;
    };

    if (reduceMotion) {
      swap();
      return;
    }

    setStaticGlitch(true);
    void resumeSobreTvAudioContext().then(() => {
      playSobreTvStaticGlitchSound(0.22);
    });
    if (glitchTimerRef.current != null) {
      window.clearTimeout(glitchTimerRef.current);
    }
    glitchTimerRef.current = window.setTimeout(() => {
      glitchTimerRef.current = null;
      swap();
      setStaticGlitch(false);
    }, TV_STATIC_GLITCH_MS);
  }, [reduceMotion, videoCandidates]);

  useEffect(() => {
    const ac = new AbortController();
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/site/sobre-videos", {
          cache: "no-store",
          signal: ac.signal,
        });
        const data = (await res.json()) as { videos?: { url: string }[] };
        if (cancelled) return;
        const urls = (data.videos ?? []).map((v) => v.url);
        const trimmed = urls.map((u) => u.trim()).filter(Boolean);
        const list =
          trimmed.length > 0 ? trimmed : [SOBRE_FALLBACK_VIDEO_URL];
        setVideoCandidates(list);
        setVideoSrc(pickRandomSobreVideoUrl(list));
      } catch (e) {
        if (cancelled || ac.signal.aborted) return;
        if (e instanceof DOMException && e.name === "AbortError") return;
        setVideoCandidates([SOBRE_FALLBACK_VIDEO_URL]);
        setVideoSrc(SOBRE_FALLBACK_VIDEO_URL);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const fn = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  useEffect(() => {
    if (!mediaReady) return;
    if (reduceMotion) {
      setCaptionOn(true);
      return;
    }
    captionTimerRef.current = window.setTimeout(() => {
      setCaptionOn(true);
    }, 2600);
    return () => {
      if (captionTimerRef.current) {
        clearTimeout(captionTimerRef.current);
        captionTimerRef.current = null;
      }
    };
  }, [mediaReady, reduceMotion]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > SCROLL_START_PX) setScrollStarted(true);

      if (!reduceMotion) {
        const range = Math.max(380, Math.floor(window.innerHeight * 0.52));
        const t = Math.min(1, Math.max(0, y / range));
        setScrollAtten(t);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduceMotion]);

  useEffect(() => {
    if (videoSrc) {
      setMediaReady(false);
      setCaptionOn(false);
    }
  }, [videoSrc]);

  const scale = reduceMotion ? 1 : 1 - 0.12 * scrollAtten;

  return (
    <div
      className={cn(
        "flex min-h-svh w-full min-w-0 max-w-full flex-col overflow-x-hidden",
        "bg-background text-foreground antialiased",
      )}
    >
      <ChromeReadyMark />
      <main
        className={cn(
          "w-full min-w-0",
          "pb-[calc(5rem+env(safe-area-inset-bottom,0px))]",
          "pt-[max(0.75rem,env(safe-area-inset-top,0px))]",
        )}
      >
        <section
          className={cn(
            "flex min-h-[100svh] flex-col justify-center",
            "pb-10 sm:pb-14",
          )}
        >
          <div className="mx-auto flex w-full max-w-[640px] flex-col items-center gap-12 px-6 sm:px-8">
            <div
              className="mx-auto w-full max-w-[600px] will-change-transform"
              style={{
                transform: `scale(${scale.toFixed(4)})`,
                transformOrigin: "center center",
              }}
            >
              <div className={FRAME_BOX}>
                {videoSrc ? (
                  <>
                    <SobreVideoShaderFrame
                      key={videoSrc}
                      videoSrc={videoSrc}
                      onMediaReady={onMediaReady}
                      volumeAttenuation={reduceMotion ? 0 : scrollAtten}
                      loop={videoCandidates.length < 2}
                      onClipEnded={
                        videoCandidates.length >= 2
                          ? handleClipEnded
                          : undefined
                      }
                    />
                    <SobreTvStaticOverlay
                      active={staticGlitch && !reduceMotion}
                      className={cn(
                        "pointer-events-none absolute inset-0 z-[15]",
                        "rounded-[inherit] [corner-shape:inherit]",
                      )}
                    />
                  </>
                ) : (
                  <div
                    className="absolute inset-0 animate-pulse bg-muted"
                    aria-hidden
                  />
                )}
              </div>
            </div>

            <div
              className={cn(
                "mx-auto flex max-w-[28rem] flex-col items-center gap-1 text-center text-[#78716C] transition-opacity ease-out",
                reduceMotion ? "duration-[600ms]" : "duration-[3400ms]",
                captionOn ? "opacity-100" : "opacity-0",
              )}
              style={{
                transitionTimingFunction: reduceMotion
                  ? undefined
                  : "cubic-bezier(0.25, 0.1, 0.25, 1)",
              }}
            >
              <p className="font-serif text-[14px] font-normal italic leading-snug">
                {dictionary.sobreCaptionLine}
              </p>
              <i
                className={cn(
                  dictionary.sobreCaptionIconClass,
                  "text-[16px] leading-none",
                )}
                aria-hidden
              />
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[640px] px-6 pb-24 pt-4 sm:px-8">
          <SobreExperienciaTimeline scrollUnlocked={scrollStarted} />
        </section>
      </main>

    </div>
  );
}
