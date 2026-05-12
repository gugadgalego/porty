"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { ChromeReadyMark } from "@/components/chrome-ready-mark";
import { SiteBottomNav } from "@/components/site-bottom-nav";
import { ShaderEffect } from "@/components/shader-effect";
import { cn } from "@/lib/utils";

const AVATAR_URL =
  "https://app.paper.design/file-assets/01KPNS3XEFGC9EW06GG45CE494/01KR9RR2B3ASMQG727R921B0EH.jpg";

const FRAME =
  "flex w-full min-w-0 max-w-[600px] flex-col items-stretch text-left";

export function SobrePageClient() {
  const { dictionary } = useLanguage();

  return (
    <div
      className={cn(
        "flex min-h-svh w-full min-w-0 max-w-full flex-col items-center overflow-x-hidden",
        "bg-background pb-[calc(2.75rem+env(safe-area-inset-bottom,0px))] text-foreground antialiased",
      )}
    >
      <ChromeReadyMark />
      <div
        className={cn(
          FRAME,
          "box-border gap-6 px-6 pt-[max(6.125rem,env(safe-area-inset-top,0px))] sm:px-8",
        )}
      >
        <div
          className="size-10 shrink-0 rounded-full bg-cover bg-center"
          style={{ backgroundImage: `url(${AVATAR_URL})` }}
          role="img"
          aria-label={dictionary.aboutPage.avatarLabel}
        />

        <p
          className={cn(
            "m-0 w-full max-w-none text-pretty font-sans text-[14px] font-light leading-[150%]",
            "text-[#78716C] dark:text-muted-foreground",
          )}
        >
          {dictionary.aboutPage.bio}
        </p>

        <div
          className={cn(
            "relative w-full shrink-0 overflow-hidden rounded-lg",
            "aspect-[3/2] max-h-[min(56vh,400px)] min-h-[200px] max-w-[600px]",
            "shadow-[0_6px_8px_rgba(0,0,0,0.2)]",
          )}
        >
          <ShaderEffect />
        </div>

        <div
          className="flex w-full items-center justify-center gap-2 p-0"
          aria-hidden
        >
          <span className="flex items-center justify-center px-1.5 py-1 outline outline-1 outline-[#E5E5E5] dark:outline-border">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              fill="#78716C"
              viewBox="0 0 256 256"
              className="shrink-0 dark:fill-muted-foreground"
            >
              <path d="M224,128a8,8,0,0,1-8,8H120v64a8,8,0,0,1-13.66,5.66l-72-72a8,8,0,0,1,0-11.32l72-72A8,8,0,0,1,120,56v64h96A8,8,0,0,1,224,128Z" />
            </svg>
          </span>
          <span className="flex items-center justify-center px-1.5 py-1 outline outline-1 outline-[#D4D4D4] dark:outline-muted-foreground/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={16}
              height={16}
              fill="#0C0A09"
              viewBox="0 0 256 256"
              className="shrink-0 dark:fill-foreground"
            >
              <path d="M221.66,133.66l-72,72A8,8,0,0,1,136,200V136H40a8,8,0,0,1,0-16h96V56a8,8,0,0,1,13.66-5.66l72,72A8,8,0,0,1,221.66,133.66Z" />
            </svg>
          </span>
        </div>

        <p
          className={cn(
            "m-0 w-fit text-center font-sans text-[14px] font-light italic leading-[130%]",
            "text-[#0C0A09] dark:text-foreground",
          )}
        >
          {dictionary.aboutPage.historyLabel}
        </p>
      </div>

      <SiteBottomNav />
    </div>
  );
}
