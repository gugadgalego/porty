"use client";

import type { PortfolioProject } from "@/lib/portfolio-project";
import { DesignPaperProjectView } from "@/components/design-paper-project-view";
import { SiteBottomNav } from "@/components/site-bottom-nav";

/** Um único boundary cliente para a página de projeto: garante que a nav e o conteúdo partilham o mesmo ciclo de rerender com o idioma. */
export function DesignProjectPageClient({
  project,
}: {
  project: PortfolioProject;
}) {
  return (
    <>
      <DesignPaperProjectView project={project} />
      <SiteBottomNav />
    </>
  );
}
