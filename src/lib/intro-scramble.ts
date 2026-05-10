/**
 * Cadência curta e legível — revelação da esquerda para a direita em cada
 * segmento; ordem global de cima para baixo via `introPartDelay`.
 */

/** Curvas `ease` aceites por `parseEase` do Anime.js — só dentro de `scrambleText()`. */
export const INTRO_SCRAMBLE_EASE_PRESETS = {
  linear: "linear",
  inOutCubic: "inOut(3)",
  outExpo: "outExpo",
} as const;

export const INTRO_SCRAMBLE = {
  /** Mais alto = revelação mais rápida (~1000/revealRate ms por passo). */
  revealRate: 58,
  /** Tempo que cada carácter “assenta” — baixo = menos arrasto visual. */
  settleDuration: 88,
  /** Menos ticks na zona aleatória = menos glitch / flicker. */
  settleRate: 4,
  /**
   * Curva da **progressão global** do reveal — passada a `scrambleText({ ease })`.
   * O `animate()` exterior não define `ease` (evita double-easing).
   * Alternativas: `INTRO_SCRAMBLE_EASE_PRESETS`.
   */
  scrambleEase: INTRO_SCRAMBLE_EASE_PRESETS.inOutCubic,
  /**
   * `false` = mantém o texto de origem até a onda de revelação chegar a cada
   * posição (menos caos simultâneo). Igual à API `override` do Anime.js.
   */
  scrambleOverride: false,
  /** Apenas letras — menos ruído que dígitos/símbolos. */
  chars: "abcdefghijklmnopqrstuvwxyz",
  from: "left" as const,
};

/**
 * Onda editorial entre **blocos** (parágrafos): ~80ms — overlap leve com o fim
 * do bloco anterior. Dentro do bloco, segmentos seguem em sequência fina.
 */
export const INTRO_BLOCK_STAGGER_MS = 80;
export const INTRO_PART_STAGGER_MS = 12;

export function introPartDelay(paragraphIdx: number, partIdx: number): number {
  return paragraphIdx * INTRO_BLOCK_STAGGER_MS + partIdx * INTRO_PART_STAGGER_MS;
}
