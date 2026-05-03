import { NextResponse } from "next/server";
import { getSitePortfolioProjects } from "@/lib/site-projects";

export const dynamic = "force-dynamic";

/** Lista pública: só projetos implementados (CMS / env), sem defaults do código. */
export async function GET() {
  const projects = await getSitePortfolioProjects();
  return NextResponse.json({ projects });
}
