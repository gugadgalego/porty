"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { EditorialLocaleScramble } from "@/components/editorial-locale-scramble";
import { INTRO_EDITORIAL_SCRAMBLE } from "@/lib/intro-scramble";
import { cn } from "@/lib/utils";

/** Label animado — alinhamento estável com o texto corrido sem forçar altura mínima artificial. */
export const INTRO_LINK_SCRAMBLE_CLASS =
  "inline max-w-full align-baseline break-words [text-wrap:pretty]";

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
  slotId: IntroInlineSlotId;
  crossfadeFrom?: string;
  play: boolean;
  startDelayMs?: number;
  scrambleSessionKey: number;
  /** Onda unificada do parágrafo: o texto do label é atualizado pelo pai. */
  waveSpanRefs?: React.MutableRefObject<Array<HTMLSpanElement | null>>;
  waveSpanIndex?: number;
};

function IntroExternalLinkInner({
  href,
  label,
  slotId,
  crossfadeFrom,
  play,
  startDelayMs = 0,
  scrambleSessionKey,
  waveSpanRefs,
  waveSpanIndex,
}: IntroExternalLinkProps) {
  const wave =
    waveSpanRefs != null && typeof waveSpanIndex === "number";

  const setWaveLabelRef = React.useCallback(
    (el: HTMLSpanElement | null) => {
      if (waveSpanRefs != null && typeof waveSpanIndex === "number") {
        waveSpanRefs.current[waveSpanIndex] = el;
      }
    },
    [waveSpanRefs, waveSpanIndex],
  );

  if (wave) {
    return (
      <Button asChild variant="link" size="xs" className={INTRO_LINK_BUTTON_CLASS}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          aria-label={label}
          data-intro-slot={slotId}
        >
          <span ref={setWaveLabelRef} className={INTRO_LINK_SCRAMBLE_CLASS} />
        </a>
      </Button>
    );
  }

  const crossfade =
    play &&
    crossfadeFrom !== undefined &&
    crossfadeFrom.length > 0 &&
    crossfadeFrom !== label;

  return (
    <Button asChild variant="link" size="xs" className={INTRO_LINK_BUTTON_CLASS}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={label}
        data-intro-slot={slotId}
      >
        <EditorialLocaleScramble
          target={label}
          source={crossfade ? crossfadeFrom : undefined}
          active={crossfade}
          runKey={scrambleSessionKey}
          staggerMs={startDelayMs}
          duration={INTRO_EDITORIAL_SCRAMBLE.duration}
          perCharPadSec={INTRO_EDITORIAL_SCRAMBLE.perCharPadSec}
          characterSet={INTRO_EDITORIAL_SCRAMBLE.characterSet}
          easeExponent={INTRO_EDITORIAL_SCRAMBLE.easeExponent}
          className={INTRO_LINK_SCRAMBLE_CLASS}
        />
      </a>
    </Button>
  );
}

export const IntroExternalLink = React.memo(IntroExternalLinkInner);
