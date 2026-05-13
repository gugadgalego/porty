import { promises as fs } from "node:fs";
import path from "node:path";

export const CMS_SOBRE_VIDEOS_DATA_PATH = path.join(
  process.cwd(),
  "src/data/cms-sobre-videos.json",
);

export type SobreCmsVideo = { id: string; url: string };

const VIDEO_FILE_EXT = /\.(mp4|webm|ogg|mov)$/i;

/** Caminhos relativos ao site (ficheiros em `public/`). */
function isSafeRelativeVideoUrl(t: string): boolean {
  if (!t.startsWith("/") || t.startsWith("//")) return false;
  if (t.includes("..")) return false;
  if (t.length > 512) return false;
  const pathOnly = t.split("?")[0]?.split("#")[0] ?? "";
  return /^\/[a-zA-Z0-9/_\.%~-]+\.(mp4|webm|ogg|mov)$/i.test(pathOnly);
}

/**
 * URLs HTTPS públicas (ex.: Vercel Blob, CDN) — recusamos `http:`, credenciais e anfitriões locais.
 */
function isSafeHttpsVideoUrl(t: string): boolean {
  if (t.length > 2048 || t.includes("<") || t.includes(">")) return false;
  let u: URL;
  try {
    u = new URL(t);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  if (u.username !== "" || u.password !== "") return false;
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return false;
  if (/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host))
    return false;
  const pathOnly = u.pathname.split("?")[0]?.split("#")[0] ?? u.pathname;
  return VIDEO_FILE_EXT.test(pathOnly);
}

/** Caminho em `public/` ou URL HTTPS de vídeo (CDN / Blob). */
export function isSafeVideoUrl(url: string): boolean {
  const t = url.trim();
  if (t.startsWith("https://")) return isSafeHttpsVideoUrl(t);
  return isSafeRelativeVideoUrl(t);
}

export function normalizeSobreVideoInput(
  v: unknown,
  index: number,
): SobreCmsVideo | null {
  if (typeof v === "string") {
    const url = v.trim();
    if (!url) return null;
    return { id: `video-${index + 1}`, url };
  }
  if (v && typeof v === "object" && "url" in v) {
    const url = String((v as { url: unknown }).url).trim();
    if (!url) return null;
    const idRaw = String((v as { id?: unknown }).id ?? "").trim();
    return { id: idRaw || `video-${index + 1}`, url };
  }
  return null;
}

export function parseSobreVideoList(raw: string): SobreCmsVideo[] | null {
  try {
    const p = JSON.parse(raw) as unknown;
    if (!Array.isArray(p)) return null;
    const out: SobreCmsVideo[] = [];
    let i = 0;
    for (const item of p) {
      const n = normalizeSobreVideoInput(item, i);
      if (n) {
        out.push(n);
        i++;
      }
    }
    return out;
  } catch {
    return null;
  }
}

/**
 * Lê a lista do CMS (ficheiro ou `CMS_SOBRE_VIDEOS_JSON`), espelhando a lógica de projetos.
 */
export async function readStoredSobreVideos(): Promise<SobreCmsVideo[]> {
  const envRaw = process.env.CMS_SOBRE_VIDEOS_JSON?.trim();

  const fromEnv = (): SobreCmsVideo[] | null => {
    if (!envRaw) return null;
    return parseSobreVideoList(envRaw);
  };

  const fromFile = async (): Promise<SobreCmsVideo[]> => {
    try {
      const raw = await fs.readFile(CMS_SOBRE_VIDEOS_DATA_PATH, "utf8");
      return parseSobreVideoList(raw) ?? [];
    } catch {
      return [];
    }
  };

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const fileVideos = await fromFile();
    if (fileVideos.length > 0) return fileVideos;
    return fromEnv() ?? [];
  }

  const envVideos = fromEnv();
  if (envVideos !== null) return envVideos;
  return fromFile();
}

export async function writeStoredSobreVideos(
  videos: SobreCmsVideo[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await fs.mkdir(path.dirname(CMS_SOBRE_VIDEOS_DATA_PATH), {
      recursive: true,
    });
    await fs.writeFile(
      CMS_SOBRE_VIDEOS_DATA_PATH,
      `${JSON.stringify(videos, null, 2)}\n`,
      "utf8",
    );
    return { ok: true };
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.message
        : "Não foi possível gravar (ex.: sistema de ficheiros só de leitura).";
    return { ok: false, error: msg };
  }
}
