import Link from "next/link";
import type { PortfolioProject } from "@/lib/portfolio-project";
import { heroCarouselSlidesFromProject } from "@/lib/portfolio-project";
import { DesignProjectTitleLink } from "@/components/design-project-title-link";
import { ProjectDetailPanel } from "@/components/project-detail-panel";
import { ProjectHeroCarouselPaper } from "@/components/project-hero-carousel-paper";
import { cn } from "@/lib/utils";

/** Ver comentário em `page.tsx`: URL canónica da grelha = `/#design`. */
const bottomNav = [
  { label: "DESIGN", href: "/#design" },
  { label: "DEV", href: "/#dev" },
  { label: "SOBRE", href: "/#sobre" },
  { label: "CV", href: "/#cv" },
] as const;

/**
 * Layout alinhado ao artboard «PROJETO ABERTO» no Paper (1AJ-0 / 1AU-0):
 * coluna 600px, pt 98px, gap 24px; título 14px itálico; carrossel hero full-bleed (600×400, setas, sem scrollbar);
 * corpo 14px light.
 */
export function DesignPaperProjectView({
  project,
  className,
}: {
  project: PortfolioProject;
  className?: string;
}) {
  const heroSlides = heroCarouselSlidesFromProject(project);

  return (
    <div
      className={cn(
        "relative min-h-svh bg-[#fafaf9] pb-[calc(3.5rem+env(safe-area-inset-bottom))] text-stone-950 antialiased",
        className,
      )}
    >
      <a
        href="#conteudo-projeto"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-stone-900 focus:px-3 focus:py-2 focus:text-sm focus:text-[#fafaf9]"
      >
        Saltar para o conteúdo
      </a>

      <main
        id="conteudo-projeto"
        className="relative mx-auto flex w-full max-w-[600px] flex-col items-start gap-6 px-4 pr-12 pt-[98px] sm:px-0 sm:pr-0"
      >
        <header className="flex w-full flex-col items-start text-left">
          <h1 className="m-0 w-full p-0 text-left font-normal">
            <DesignProjectTitleLink
              title={project.title}
              href="/#design"
              ariaLabel={`${project.title}: ver todos os projetos`}
            />
          </h1>
          {project.subtitle ? (
            <p className="mt-3 w-full max-w-[36rem] text-left text-[13px] font-light leading-snug text-stone-600 dark:text-stone-400">
              {project.subtitle}
            </p>
          ) : null}
        </header>

        <ProjectHeroCarouselPaper slides={heroSlides} className="w-full" />

        <ProjectDetailPanel
          project={project}
          omitHeader
          variant="paper"
          className="scroll-mt-0"
        />
      </main>

      <nav
        aria-label="Secções do site"
        className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-center border-t border-stone-200/80 bg-[#fafaf9] pb-[env(safe-area-inset-bottom)]"
      >
        {bottomNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 font-mono text-[12px] font-medium leading-[1.3] text-stone-950 transition-colors hover:bg-stone-200/60"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
