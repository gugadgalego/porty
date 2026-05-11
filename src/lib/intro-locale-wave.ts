/**
 * Onda PT ↔ EN (pontos) — um segmento ou vários segmentos com índice global contínuo.
 */

export type IntroLocaleWaveSegment = {
  target: string;
  source: string;
};

export function waveNoiseChar(charSet: string, globalIndex: number, head: number): string {
  const set = charSet.length > 0 ? charSet : ".";
  return set[(globalIndex + head) % set.length] ?? ".";
}

/** Prefixos cumulativos; `prefix[i]` = início do segmento `i`, `prefix[n]` = comprimento total. */
export function computeWavePrefixLengths(
  segments: readonly IntroLocaleWaveSegment[],
): number[] {
  const prefix: number[] = [0];
  for (const s of segments) {
    const L = Math.max(s.target.length, s.source.length);
    prefix.push(prefix[prefix.length - 1]! + L);
  }
  return prefix;
}

/**
 * Um frame da onda para **todo** o parágrafo (índice global contínuo entre segmentos).
 */
export function buildUnifiedParagraphFrames(
  progress: number,
  segments: readonly IntroLocaleWaveSegment[],
  prefix: readonly number[],
  charSet: string,
  easeExponent: number,
  waveWidth: number,
): string[] {
  const n = segments.length;
  const totalLen = prefix[n] ?? 0;
  if (totalLen === 0 || n === 0) {
    return segments.map(() => "");
  }

  const t = 1 - Math.pow(1 - Math.min(1, Math.max(0, progress)), easeExponent);
  const span = totalLen + Math.max(1, waveWidth);
  const head = Math.min(span, Math.floor(t * span));
  const dotStart = Math.max(0, head - waveWidth);
  const dotEnd = Math.min(totalLen, head);

  const frames: string[] = [];
  for (let si = 0; si < n; si++) {
    const seg = segments[si]!;
    const lo = prefix[si]!;
    const hi = prefix[si + 1]!;
    const { target, source } = seg;
    let out = "";
    for (let j = 0; j < hi - lo; j++) {
      const g = lo + j;
      const tc = target[j];
      const sc = source[j];
      if (tc === "\n" || tc === "\r") {
        out += tc ?? "";
        continue;
      }
      if (g < dotStart) {
        out += tc ?? "";
      } else if (g < dotEnd) {
        if (tc === " ") {
          out += " ";
        } else if (tc !== undefined && sc !== undefined && tc !== sc) {
          out += waveNoiseChar(charSet, g, head);
        } else {
          out += tc ?? "";
        }
      } else {
        out += sc !== undefined && sc !== "" ? sc : (tc ?? "");
      }
    }
    frames.push(out);
  }
  return frames;
}

export function buildEditorialFrame(
  progress: number,
  target: string,
  source: string | undefined,
  charSet: string,
  easeExponent: number,
  waveWidth: number,
): string {
  const src = source ?? "";
  const L = Math.max(target.length, src.length);
  if (L === 0) return "";
  const prefix = [0, L];
  const frames = buildUnifiedParagraphFrames(
    progress,
    [{ target, source: src }],
    prefix,
    charSet,
    easeExponent,
    waveWidth,
  );
  return frames[0] ?? "";
}
