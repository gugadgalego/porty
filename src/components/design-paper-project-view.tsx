"use client";

import Link from "next/link";
import type { PortfolioProject } from "@/lib/portfolio-project";
import { heroCarouselSlidesFromProject } from "@/lib/portfolio-project";
import { useLanguage } from "@/components/providers/language-provider";
import { ChromeReadyMark } from "@/components/chrome-ready-mark";
import { ProjectDetailPanel } from "@/components/project-detail-panel";
import { ProjectHeroCarouselPaper } from "@/components/project-hero-carousel-paper";
import { cn } from "@/lib/utils";

/** Frame único: até 600px de largura, centrado na viewport; conteúdo ao topo e à esquerda. */
const FRAME =
  "flex w-full max-w-[600px] flex-col items-stretch text-left";

/** Espaço vertical entre secções (24px). */
const SECTION_GAP = "gap-[24px]";

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
        "flex min-h-svh w-full flex-col items-center bg-background pb-[calc(2.75rem+env(safe-area-inset-bottom,0px))] text-foreground antialiased",
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
          "box-border px-6 pb-12 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-8",
        )}
      >
        <header className="w-full shrink-0 pt-16">
          <h1 className="m-0 w-full p-0 text-left">
            <Link
              href="/#design"
              className={cn(
                "inline-block text-balance font-serif text-[14px] font-normal italic leading-[1.3] text-foreground",
                "outline-none transition-opacity hover:opacity-70",
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
