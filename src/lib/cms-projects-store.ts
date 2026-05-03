import { promises as fs } from "node:fs";
import path from "node:path";
import type { PortfolioProject } from "@/lib/portfolio-project";
import {
  CMS_PROJECTS_DATA_PATH,
  readStoredProjects,
} from "@/lib/site-projects";

/** Lista guardada (env ou ficheiro): o mesmo conjunto que `savePublishedProjects` grava. */
export async function getPublishedProjects(): Promise<PortfolioProject[]> {
  return readStoredProjects();
}

/** Persiste a lista completa (substitui o ficheiro). */
export async function savePublishedProjects(
  projects: PortfolioProject[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await fs.mkdir(path.dirname(CMS_PROJECTS_DATA_PATH), { recursive: true });
    await fs.writeFile(
      CMS_PROJECTS_DATA_PATH,
      `${JSON.stringify(projects, null, 2)}\n`,
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
