import type { Dictionary, Locale } from "@/lib/i18n";
import { dictionaries } from "@/lib/i18n";

/** Mesmo padrão do intro em `page.tsx` — mantém índices alinhados entre idiomas. */
export const INTRO_PLACEHOLDER_RE =
  /(\{UPM\}|\{SME\}|\{PAPELZINHO\}|\{ORLA\}|\{ADA\})/g;

const PLACEHOLDERS = new Set([
  "{UPM}",
  "{SME}",
  "{PAPELZINHO}",
  "{ORLA}",
  "{ADA}",
]);

/** Segmento `{UPM}` / `{SME}` / etc. — índices alinhados PT/EN em `prepareIntroParagraphDual`. */
export function isIntroPlaceholderToken(token: string): boolean {
  return PLACEHOLDERS.has(token);
}

/** Idioma oposto (PT ↔ EN); extensível para mais `Locale` no futuro. */
export function mirrorLocale(locale: Locale): Locale {
  return locale === "pt" ? "en" : "pt";
}

export function resolveIntroToken(token: string, dict: Dictionary): string {
  switch (token) {
    case "{UPM}":
      return dict.upmLabel;
    case "{SME}":
      return "SME";
    case "{PAPELZINHO}":
      return dict.papelzinhoLabel;
    case "{ORLA}":
      return dict.orlaLabel;
    case "{ADA}":
      return dict.appleDeveloperAcademyLabel;
    default:
      return token;
  }
}

export type PreparedIntroParagraph = {
  /** Segmentos do idioma visível (já sem pontuação “emprestada” do segmento seguinte). */
  currentParts: string[];
  /** Segmentos paralelos do idioma espelho — mesmos índices que `currentParts`. */
  mirrorParts: string[];
};

/**
 * Prepara dois parágrafos em paralelo: remove pontuação inicial do segmento seguinte
 * depois de cada placeholder, **nos dois idiomas ao mesmo tempo**, para os índices baterem.
 */
export function prepareIntroParagraphDual(
  currentRaw: string,
  mirrorRaw: string,
): PreparedIntroParagraph {
  const currentParts = currentRaw.split(INTRO_PLACEHOLDER_RE);
  const mirrorParts = mirrorRaw.split(INTRO_PLACEHOLDER_RE);

  const n = Math.min(currentParts.length, mirrorParts.length);
  for (let i = 0; i < n; i += 1) {
    const part = currentParts[i] ?? "";
    if (!isIntroPlaceholderToken(part)) continue;

    const nextCur = currentParts[i + 1] ?? "";
    const nextMir = mirrorParts[i + 1] ?? "";
    const mCur = nextCur.match(/^([,.;:!?]+)/);
    const mMir = nextMir.match(/^([,.;:!?]+)/);
    if (mCur?.[1]) {
      currentParts[i + 1] = nextCur.slice(mCur[1].length);
    }
    if (mMir?.[1]) {
      mirrorParts[i + 1] = nextMir.slice(mMir[1].length);
    }
  }

  return { currentParts, mirrorParts };
}

/** Pontuação que vinha colada ao segmento seguinte (para renderizar após o link). */
export function trailingPunctAfterPlaceholder(
  rawParagraph: string,
  placeholderIndex: number,
): string | null {
  const parts = rawParagraph.split(INTRO_PLACEHOLDER_RE);
  const tok = parts[placeholderIndex] ?? "";
  if (!isIntroPlaceholderToken(tok)) return null;
  const next = parts[placeholderIndex + 1] ?? "";
  const m = next.match(/^([,.;:!?]+)/);
  return m?.[1] ?? null;
}

/** Texto animável para crossfade: resolved label ou texto corrido. */
export function segmentResolvedText(token: string, dict: Dictionary): string {
  return isIntroPlaceholderToken(token) ? resolveIntroToken(token, dict) : token;
}

export function getMirrorDictionary(locale: Locale): Dictionary {
  return dictionaries[mirrorLocale(locale)];
}
