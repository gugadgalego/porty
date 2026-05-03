import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CMS_SESSION_COOKIE, verifySessionToken } from "@/lib/cms-auth";
import {
  getPublishedProjects,
  savePublishedProjects,
} from "@/lib/cms-projects-store";
import {
  isProject,
  normalizeProject,
  type PortfolioProject,
} from "@/lib/portfolio-project";

export const dynamic = "force-dynamic";

/** Lista completa no CMS (inclui rascunhos). Requer sessão. */
export async function GET() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const projects = await getPublishedProjects();
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const tok = cookieStore.get(CMS_SESSION_COOKIE)?.value;
  if (!verifySessionToken(tok)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const raw = (body as { projects?: unknown }).projects;
  if (!Array.isArray(raw)) {
    return NextResponse.json(
      { error: "`projects` deve ser um array" },
      { status: 400 },
    );
  }

  const projects: PortfolioProject[] = [];
  for (const item of raw) {
    if (!isProject(item)) continue;
    projects.push(normalizeProject(item));
  }

  const filtered = projects.filter((p) => p.id.length > 0);
  const result = await savePublishedProjects(filtered);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
