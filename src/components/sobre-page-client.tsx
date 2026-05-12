"use client";

import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { ChromeReadyMark } from "@/components/chrome-ready-mark";
import { SiteBottomNav } from "@/components/site-bottom-nav";
import { SobreCoverflowFrame } from "@/components/sobre-coverflow-frame";
import { SobreVideoShaderFrame } from "@/components/sobre-video-shader-frame";
import { Button } from "@/components/ui/button";
import {
  carouselFrameNavButtonClass,
  carouselFrameNavIconActive,
  carouselFrameNavIconDisabled,
  carouselFrameNavOutlineActive,
  carouselFrameNavOutlineDisabled,
} from "@/lib/carousel-frame-nav";
import { cn } from "@/lib/utils";

const FRAME = cn(
  "flex w-full min-w-0 max-w-[600px] flex-col items-center gap-6 text-center",
);

export function SobrePageClient() {
  const [frameIndex, setFrameIndex] = useState(0);
  const isVideoFrame = frameIndex === 0;

  return (
    <div
      className={cn(
        "flex min-h-svh w-full min-w-0 max-w-full flex-col overflow-x-hidden",
        "bg-background text-foreground antialiased",
      )}
    >
      <ChromeReadyMark />
      <div
        className={cn(
          "flex w-full flex-1 flex-col items-center justify-center px-6 py-8 sm:px-8",
          "min-h-0 pb-[calc(2.75rem+env(safe-area-inset-bottom,0px))]",
        )}
      >
        <div className={FRAME}>
          <div
            className={cn(
              "relative w-full shrink-0 overflow-hidden rounded-lg",
              "aspect-[3/2] max-h-[min(56vh,400px)] min-h-[200px] max-w-[600px]",
              "shadow-[0_6px_8px_rgba(0,0,0,0.2)]",
              "dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_2px_4px_rgba(0,0,0,0.4),0_20px_48px_-12px_rgba(0,0,0,0.85),0_12px_24px_-8px_rgba(0,0,0,0.65)]",
            )}
          >
            {/* Ambos montados: o vídeo/shader não desmonta ao ir ao CoverFlow — mantém tempo de reprodução. */}
            <div
              className={cn(
                "absolute inset-0 overflow-hidden rounded-[inherit]",
                isVideoFrame ? "z-10" : "invisible pointer-events-none z-0",
              )}
              aria-hidden={!isVideoFrame}
            >
              <SobreVideoShaderFrame presentationHidden={!isVideoFrame} />
            </div>
            <div
              className={cn(
                "absolute inset-0 overflow-hidden rounded-[inherit]",
                !isVideoFrame ? "z-10" : "invisible pointer-events-none z-0",
              )}
              aria-hidden={isVideoFrame}
            >
              <SobreCoverflowFrame />
            </div>
          </div>

          <div className="flex w-full items-center justify-center gap-2 p-0">
            <Button
              type="button"
              variant="ghost"
              aria-label="Frame anterior: vídeo com shader"
              disabled={isVideoFrame}
              onClick={() => setFrameIndex(0)}
              className={cn(
                carouselFrameNavButtonClass,
                isVideoFrame
                  ? carouselFrameNavOutlineDisabled
                  : carouselFrameNavOutlineActive,
              )}
            >
              <CaretLeft
                className={cn(
                  "size-4 shrink-0",
                  isVideoFrame
                    ? carouselFrameNavIconDisabled
                    : carouselFrameNavIconActive,
                )}
                weight="regular"
                aria-hidden
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-label="Seguinte: CoverFlow"
              disabled={!isVideoFrame}
              onClick={() => setFrameIndex(1)}
              className={cn(
                carouselFrameNavButtonClass,
                !isVideoFrame
                  ? carouselFrameNavOutlineDisabled
                  : carouselFrameNavOutlineActive,
              )}
            >
              <CaretRight
                className={cn(
                  "size-4 shrink-0",
                  !isVideoFrame
                    ? carouselFrameNavIconDisabled
                    : carouselFrameNavIconActive,
                )}
                weight="regular"
                aria-hidden
              />
            </Button>
          </div>
        </div>
      </div>

      <SiteBottomNav />
    </div>
  );
}
