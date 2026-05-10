"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { AnimeScrambleText } from "@/components/anime-scramble-text";
import { INTRO_SCRAMBLE } from "@/lib/intro-scramble";
import { cn } from "@/lib/utils";

/** Label animado — alinhamento estável com o texto corrido sem forçar altura mínima artificial. */
export const INTRO_LINK_SCRAMBLE_CLASS =
  "inline-block max-w-full align-baseline";

/** Estilo partilhado pelos links inline do intro (PT/EN). */
export const INTRO_LINK_BUTTON_CLASS = cn(
  "h-auto min-h-0 !inline-block w-auto !justify-start p-0 font-serif text-[14px] font-light leading-[1.55] tracking-[-0.02em] text-muted-foreground",
  "decoration-muted-foreground/40 underline-offset-[3px] hover:text-foreground",
  "!whitespace-normal align-baseline",
);

/** Identificador estável do placeholder no intro (PT/EN partilham o mesmo DOM slot). */
export type IntroInlineSlotId =
  | "upm"
  | "sme"
  | "papelzinho"
  | "orla"
  | "ada";

type IntroExternalLinkProps = {
  href: string;
  label: string;
  /** Mesmo id em ambos os idiomas — alinha DOM e evita remount desnecessário na troca de locale. */
  slotId: IntroInlineSlotId;
  crossfadeFrom?: string;
  play: boolean;
  startDelayMs: number;
};

function IntroExternalLinkInner({
  href,
  label,
  slotId,
  crossfadeFrom,
  play,
  startDelayMs,
}: IntroExternalLinkProps) {
  return (
    <Button asChild variant="link" size="xs" className={INTRO_LINK_BUTTON_CLASS}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        data-intro-slot={slotId}
      >
        <AnimeScrambleText
          mode="decorative"
          text={label}
          fromText={play ? crossfadeFrom : undefined}
          play={play}
          startDelayMs={startDelayMs}
          revealRate={INTRO_SCRAMBLE.revealRate}
          settleDuration={INTRO_SCRAMBLE.settleDuration}
          settleRate={INTRO_SCRAMBLE.settleRate}
          scrambleEase={INTRO_SCRAMBLE.scrambleEase}
          scrambleOverride={INTRO_SCRAMBLE.scrambleOverride}
          chars={INTRO_SCRAMBLE.chars}
          from={INTRO_SCRAMBLE.from}
          className={INTRO_LINK_SCRAMBLE_CLASS}
        />
      </a>
    </Button>
  );
}

export const IntroExternalLink = React.memo(IntroExternalLinkInner);
