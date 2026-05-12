"use client";

import { useState } from "react";
import { ChromeReadyMark } from "@/components/chrome-ready-mark";
import { SiteBottomNav } from "@/components/site-bottom-nav";
import { SobreCoverflowFrame } from "@/components/sobre-coverflow-frame";
import { SobreVideoShaderFrame } from "@/components/sobre-video-shader-frame";
import { cn } from "@/lib/utils";

const FRAME = cn(
  "flex w-full min-w-0 max-w-[600px] flex-col items-center gap-6 text-center",
);

const ARROW_BTN = cn(
  "flex items-center justify-center px-1.5 py-1 text-foreground outline outline-1 transition-opacity",
  "outline-[#E5E5E5] dark:outline-border",
  "enabled:hover:opacity-90 enabled:focus-visible:ring-2 enabled:focus-visible:ring-ring enabled:focus-visible:ring-offset-2",
  "disabled:cursor-not-allowed disabled:opacity-35",
);

const ARROW_BTN_RIGHT = cn(
  ARROW_BTN,
  "outline-[#D4D4D4] dark:outline-muted-foreground/40",
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
            )}
          >
            {isVideoFrame ? <SobreVideoShaderFrame /> : <SobreCoverflowFrame />}
          </div>

          <div className="flex w-full items-center justify-center gap-2 p-0">
            <button
              type="button"
              className={ARROW_BTN}
              aria-label="Frame anterior: vídeo com shader"
              disabled={isVideoFrame}
              onClick={() => setFrameIndex(0)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={16}
                height={16}
                fill="currentColor"
                viewBox="0 0 256 256"
                className="shrink-0 text-[#78716C] dark:text-muted-foreground"
              >
                <path d="M224,128a8,8,0,0,1-8,8H120v64a8,8,0,0,1-13.66,5.66l-72-72a8,8,0,0,1,0-11.32l72-72A8,8,0,0,1,120,56v64h96A8,8,0,0,1,224,128Z" />
              </svg>
            </button>
            <button
              type="button"
              className={ARROW_BTN_RIGHT}
              aria-label="Seguinte: CoverFlow"
              disabled={!isVideoFrame}
              onClick={() => setFrameIndex(1)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width={16}
                height={16}
                fill="currentColor"
                viewBox="0 0 256 256"
                className="shrink-0 text-[#0C0A09] dark:text-foreground"
              >
                <path d="M221.66,133.66l-72,72A8,8,0,0,1,136,200V136H40a8,8,0,0,1,0-16h96V56a8,8,0,0,1,13.66-5.66l72,72A8,8,0,0,1,221.66,133.66Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <SiteBottomNav />
    </div>
  );
}
