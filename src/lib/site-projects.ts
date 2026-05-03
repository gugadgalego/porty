import { promises as fs } from "node:fs";
import path from "node:path";
import type { PortfolioProject } from "@/lib/portfolio-project";
import { isProject, normalizeProject } from "@/lib/portfolio-project";

/** Ficheiro local (git / deploy com ficheiro). Em produção sem FS, usa `CMS_PROJECTS_JSON`. */
export const CMS_PROJECTS_DATA_PATH = path.join(
  process.cwd(),
  "src/data/cms-projects.json",
);

function parseProjectList(raw: string): PortfolioProject[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter(isProject).map((p) => normalizeProject(p));
  } catch {
    return null;
  }
}

/**
 * Lê projetos tal como estão guardados (sem defaults do código).
 *
 * **Produção:** `CMS_PROJECTS_JSON` (array JSON) tem prioridade; senão lê o ficheiro.
 *
 * **Desenvolvimento:** se o ficheiro tiver entradas, usa-o primeiro — evita que um
 * `CMS_PROJECTS_JSON=[]` (ou snapshot antigo) no `.env.local` esconda o que o CMS gravou em disco.
 */
export async function readStoredProjects(): Promise<PortfolioProject[]> {
  const envRaw = process.env.CMS_PROJECTS_JSON?.trim();

  const fromEnv = (): PortfolioProject[] | null => {
    if (!envRaw) return null;
    return parseProjectList(envRaw);
  };

  const fromFile = async (): Promise<PortfolioProject[]> => {
    try {
      const raw = await fs.readFile(CMS_PROJECTS_DATA_PATH, "utf8");
      return parseProjectList(raw) ?? [];
    } catch {
      return [];
    }
  };

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    const fileProjects = await fromFile();
    if (fileProjects.length > 0) return fileProjects;
    return fromEnv() ?? [];
  }

  const envProjects = fromEnv();
  if (envProjects !== null) return envProjects;
  return fromFile();
}

/** Visível na grelha Design e em `/design/[id]`: não rascunho; id e título obrigatórios. */
export function filterImplementedForSite(
  projects: PortfolioProject[],
): PortfolioProject[] {
  return projects.filter((p) => {
    if (p.implemented === false) return false;
    if (!p.id?.trim() || !p.title?.trim()) return false;
    return true;
  });
}

export async function getSitePortfolioProjects(): Promise<PortfolioProject[]> {
  const raw = await readStoredProjects();
  return filterImplementedForSite(raw);
}
