import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { DesignProjectPageClient } from "@/components/design-project-page-client";
import { getSitePortfolioProjects } from "@/lib/site-projects";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const projects = await getSitePortfolioProjects();
  const p = projects.find((x) => x.id === id);
  return {
    title: p ? `${p.title} — Porty` : "Projeto — Porty",
    robots: { index: true, follow: true },
  };
}

export default async function DesignProjectPage({ params }: Props) {
  const { id } = await params;
  const projects = await getSitePortfolioProjects();
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();

  return <DesignProjectPageClient project={project} />;
}
