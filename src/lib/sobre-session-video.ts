export const SOBRE_FALLBACK_VIDEO_URL = "/videos/sobre-dijon.mp4";

const LEGACY_SESSION_VIDEO_URL_KEY = "porty:sobre:sessionVideoUrl";

/**
 * Escolhe um URL ao acaso entre os candidatos **em cada carga** da lista
 * (cada visita a `/sobre` ou refresh). Não persiste o clip entre visitas.
 */
export function pickRandomSobreVideoUrl(urls: string[]): string {
  try {
    sessionStorage.removeItem(LEGACY_SESSION_VIDEO_URL_KEY);
  } catch {
    /* ignore */
  }

  const valid = urls.map((u) => u.trim()).filter(Boolean);
  if (valid.length === 0) return SOBRE_FALLBACK_VIDEO_URL;
  const idx = Math.floor(Math.random() * valid.length);
  return valid[idx]!;
}

/**
 * Igual a `pickRandomSobreVideoUrl`, mas evita repetir `except` quando há alternativas
 * (troca entre clips ao fim do vídeo).
 */
export function pickRandomSobreVideoUrlExcept(
  urls: string[],
  except: string | null,
): string {
  const valid = urls.map((u) => u.trim()).filter(Boolean);
  if (valid.length === 0) return SOBRE_FALLBACK_VIDEO_URL;
  if (valid.length === 1) return valid[0]!;
  const filtered = except ? valid.filter((u) => u !== except) : valid;
  const pool = filtered.length > 0 ? filtered : valid;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx]!;
}
