/**
 * Cadência do scramble editorial (Motion Primitives + onda).
 */

/** Parâmetros partilhados pelo intro e links inline (troca PT ↔ EN). */
export const INTRO_EDITORIAL_SCRAMBLE = {
  /** Duração base do segmento (s). */
  duration: 0.28,
  /** Extensão por carácter (s) — segmentos longos ganham ligeiramente mais parede. */
  perCharPadSec: 0.012,
  /** Curva editorial: suaviza o fim da onda (maior = mais suave). */
  easeExponent: 2.35,
  /** Onda minimalista: ponto e espaço (referência Motion Primitives). */
  characterSet: ". ",
  /** Largura da faixa de “pontos” que percorre o texto. */
  waveWidth: 4,
} as const;

/**
 * Legado: pequeno escalonamento editorial (não usado no scramble global).
 */
export const INTRO_BLOCK_STAGGER_MS = 80;
export const INTRO_PART_STAGGER_MS = 18;

export function introPartDelay(paragraphIdx: number, partIdx: number): number {
  return paragraphIdx * INTRO_BLOCK_STAGGER_MS + partIdx * INTRO_PART_STAGGER_MS;
}
