"use client";

import Link from "next/link";
import type { PortfolioProject } from "@/lib/portfolio-project";
import { heroCarouselSlidesFromProject } from "@/lib/portfolio-project";
import { useLanguage } from "@/components/providers/language-provider";
import { ChromeReadyMark } from "@/components/chrome-ready-mark";
import { ProjectDetailPanel } from "@/components/project-detail-panel";
import { ProjectHeroCarouselPaper } from "@/components/project-hero-carousel-paper";
import { cn } from "@/lib/utils";

/** Frame editorial (ritmo tipo ja.mt/work): coluna estreita, texto à esquerda. */
const FRAME =
  "flex w-full min-w-0 max-w-[min(40rem,calc(100vw-1.5rem))] flex-col items-stretch text-left";

/** Espaço vertical uniforme entre os itens da página de projeto. */
const SECTION_GAP = "gap-6";

/**
 * Página de projeto: um frame centrado (600px), conteúdo alinhado ao topo/esquerda;
 * Carrossel em faixa com fotos visíveis à direita/esquerda; troca animada só com setas.
 */
export function DesignPaperProjectView({
  project,
  className,
}: {
  project: PortfolioProject;
  className?: string;
}) {
  const { dictionary } = useLanguage();
  const heroSlides = heroCarouselSlidesFromProject(project);

  return (
    <div
      className={cn(
        "flex min-h-svh w-full min-w-0 max-w-full flex-col items-center overflow-x-hidden bg-background pb-[calc(2.75rem+env(safe-area-inset-bottom,0px))] text-foreground antialiased",
        className,
      )}
    >
      <ChromeReadyMark />
      <a
        href="#conteudo-projeto"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-background"
      >
        {dictionary.skipToContent}
      </a>

      <div
        className={cn(
          FRAME,
          SECTION_GAP,
          "box-border px-6 pb-16 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-8 sm:pb-24",
        )}
      >
        <header className="w-full shrink-0 pt-12 sm:pt-20">
          <h1 className="m-0 w-full p-0 text-left font-serif text-[14px] font-normal italic leading-[1.3] text-foreground">
            <Link
              href="/?view=design#design"
              className={cn(
                "inline-block outline-none transition-opacity hover:opacity-75",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              {project.title}
            </Link>
          </h1>
        </header>

        <div className="w-full min-w-0 shrink-0">
          <ProjectHeroCarouselPaper slides={heroSlides} />
        </div>

        <main id="conteudo-projeto" className="flex w-full flex-col">
          <ProjectDetailPanel
            project={project}
            omitHeader
            variant="paper"
            className="w-full scroll-mt-0"
          />
        </main>
      </div>
    </div>
  );
}
