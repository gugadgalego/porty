"use client";

import * as React from "react";
import { animate, scrambleText } from "animejs";
import {
  IntroExternalLink,
  type IntroInlineSlotId,
} from "@/components/intro-external-link";
import type { Dictionary } from "@/lib/i18n";
import {
  computeWavePrefixLengths,
  type IntroLocaleWaveSegment,
} from "@/lib/intro-locale-wave";
import {
  prepareIntroParagraphDual,
  segmentResolvedText,
  trailingPunctAfterPlaceholder,
} from "@/lib/intro-segments";
import { cn } from "@/lib/utils";

const INTRO_SCRAMBLE_SEGMENT_CLASS = cn(
  "inline max-w-full align-baseline whitespace-pre-wrap break-words [text-wrap:pretty]",
);

type IntroParagraphLocaleWaveProps = {
  paragraphRaw: string;
  paragraphIndex: number;
  dictionary: Dictionary;
  mirrorDict: Dictionary;
  shouldScramble: boolean;
  revealKey: number;
  prefersReducedMotion: boolean;
};

type WaveRow =
  | {
      kind: "text";
      key: string;
      srText: string;
      segment: IntroLocaleWaveSegment;
    }
  | {
      kind: "link";
      key: string;
      segment: IntroLocaleWaveSegment;
      href: string;
      slotId: IntroInlineSlotId;
      label: string;
      trailingPunct: string | null;
    };

function buildWaveRows(
  paragraphRaw: string,
  paragraphIndex: number,
  dictionary: Dictionary,
  mirrorDict: Dictionary,
  mirrorRaw: string,
): WaveRow[] {
  const { currentParts, mirrorParts } = prepareIntroParagraphDual(
    paragraphRaw,
    mirrorRaw,
  );
  const rows: WaveRow[] = [];

  for (let i = 0; i < currentParts.length; i += 1) {
    const part = currentParts[i] ?? "";
    const crossfadeMirror = segmentResolvedText(mirrorParts[i] ?? "", mirrorDict);

    const pushLink = (
      slotId: IntroInlineSlotId,
      href: string,
      label: string,
    ) => {
      const punct = trailingPunctAfterPlaceholder(paragraphRaw, i);
      const source =
        crossfadeMirror !== label && crossfadeMirror.length > 0
          ? crossfadeMirror
          : label;
      rows.push({
        kind: "link",
        key: `intro-w-${paragraphIndex}-link-${slotId}-${i}`,
        segment: { target: label, source },
        href,
        slotId,
        label,
        trailingPunct: punct,
      });
    };

    if (part === "{UPM}") {
      pushLink("upm", "https://www.mackenzie.br/", dictionary.upmLabel);
      continue;
    }
    if (part === "{SME}") {
      pushLink("sme", "https://sistemasdeensino.mackenzie.br/", "SME");
      continue;
    }
    if (part === "{PAPELZINHO}") {
      pushLink(
        "papelzinho",
        "https://papelzinho.com/",
        dictionary.papelzinhoLabel,
      );
      continue;
    }
    if (part === "{ORLA}") {
      pushLink("orla", "https://www.orla.tech/", dictionary.orlaLabel);
      continue;
    }
    if (part === "{ADA}") {
      pushLink(
        "ada",
        "https://developer.apple.com/academies/",
        dictionary.appleDeveloperAcademyLabel,
      );
      continue;
    }

    if (!part) continue;

    const mirrorText = mirrorParts[i] ?? "";
    rows.push({
      kind: "text",
      key: `intro-w-${paragraphIndex}-t-${i}`,
      srText: part,
      segment: { target: part, source: mirrorText },
    });
  }

  return rows;
}

export function IntroParagraphLocaleWave({
  paragraphRaw,
  paragraphIndex,
  dictionary,
  mirrorDict,
  shouldScramble,
  revealKey,
  prefersReducedMotion,
}: IntroParagraphLocaleWaveProps) {
  const mirrorRaw = mirrorDict.intro[paragraphIndex] ?? "";

  const rows = React.useMemo(
    () =>
      buildWaveRows(
        paragraphRaw,
        paragraphIndex,
        dictionary,
        mirrorDict,
        mirrorRaw,
      ),
    [paragraphRaw, paragraphIndex, dictionary, mirrorDict, mirrorRaw],
  );

  const segments = React.useMemo(
    () => rows.map((r) => r.segment),
    [rows],
  );

  const prefix = React.useMemo(
    () => computeWavePrefixLengths(segments),
    [segments],
  );

  const totalLen = prefix[prefix.length - 1] ?? 0;

  const spanRefs = React.useRef<Array<HTMLSpanElement | null>>([]);

  const syncStaticTargets = React.useCallback(() => {
    for (let i = 0; i < rows.length; i++) {
      const el = spanRefs.current[i];
      if (!el) continue;
      el.textContent = rows[i]!.segment.target;
    }
  }, [rows]);

  React.useLayoutEffect(() => {
    if (!shouldScramble || prefersReducedMotion) {
      syncStaticTargets();
      return;
    }
    let anyCrossfade = false;
    for (const r of rows) {
      const { target, source } = r.segment;
      if (source.length > 0 && source !== target) {
        anyCrossfade = true;
        break;
      }
    }
    if (!anyCrossfade) {
      syncStaticTargets();
      return;
    }
    for (let i = 0; i < rows.length; i++) {
      const el = spanRefs.current[i];
      if (!el) continue;
      const { target, source } = rows[i]!.segment;
      if (source.length > 0 && source !== target) {
        el.textContent = source;
      } else {
        el.textContent = target;
      }
    }
  }, [
    shouldScramble,
    prefersReducedMotion,
    revealKey,
    rows,
    syncStaticTargets,
  ]);

  React.useEffect(() => {
    if (!shouldScramble || prefersReducedMotion) {
      syncStaticTargets();
      return;
    }

    let anyCrossfade = false;
    for (const r of rows) {
      const { target, source } = r.segment;
      if (source.length > 0 && source !== target) {
        anyCrossfade = true;
        break;
      }
    }
    if (!anyCrossfade) {
      syncStaticTargets();
      return;
    }

    const staggerMaxMs = 420;
    const running: Array<{ revert: () => unknown }> = [];
    let rafId = 0;
    let cancelled = false;

    const startAnimations = () => {
      if (cancelled) return;
      for (let i = 0; i < segments.length; i += 1) {
        if (spanRefs.current[i] == null) {
          rafId = requestAnimationFrame(startAnimations);
          return;
        }
      }
      for (let i = 0; i < rows.length; i += 1) {
        const el = spanRefs.current[i];
        if (!el) continue;
        const target = rows[i]!.segment.target;
        const delay =
          totalLen > 0
            ? (prefix[i]! / totalLen) * staggerMaxMs
            : 0;
        const anim = animate(el, {
          innerHTML: scrambleText({
            text: target,
            chars: ". ",
            ease: "out(2)",
          }),
          delay,
        });
        running.push(anim);
      }
    };

    rafId = requestAnimationFrame(startAnimations);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      for (const a of running) {
        try {
          a.revert();
        } catch {
          /* ignore */
        }
      }
    };
  }, [
    shouldScramble,
    prefersReducedMotion,
    revealKey,
    rows,
    segments,
    prefix,
    totalLen,
    syncStaticTargets,
  ]);

  const setSpanRef = (index: number) => (el: HTMLSpanElement | null) => {
    spanRefs.current[index] = el;
  };

  return (
    <>
      {rows.map((row, idx) => {
        if (row.kind === "link") {
          return (
            <span
              key={row.key}
              className="inline align-baseline [text-wrap:pretty]"
            >
              <IntroExternalLink
                href={row.href}
                label={row.label}
                slotId={row.slotId}
                play={false}
                scrambleSessionKey={revealKey}
                waveLabelRef={setSpanRef(idx)}
              />
              {row.trailingPunct}
            </span>
          );
        }
        return (
          <React.Fragment key={row.key}>
            <span className="sr-only">{row.srText}</span>
            <span
              ref={setSpanRef(idx)}
              className={INTRO_SCRAMBLE_SEGMENT_CLASS}
            />
          </React.Fragment>
        );
      })}
    </>
  );
}
