import Link from "next/link";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";
import type { PortfolioProject } from "@/lib/portfolio-project";
import { heroCarouselSlidesFromProject } from "@/lib/portfolio-project";
import { ProjectDetailPanel } from "@/components/project-detail-panel";
import { ProjectHeroCarouselPaper } from "@/components/project-hero-carousel-paper";
import { cn } from "@/lib/utils";

/** URL canónica da grelha = `/#design`. */
const bottomNav = [
  { label: "DESIGN", href: "/#design" },
  { label: "DEV", href: "/#dev" },
  { label: "SOBRE", href: "/#sobre" },
  { label: "CV", href: "/#cv" },
] as const;

/**
 * Página de projeto aberto: fundo branco, coluna alinhada à esquerda com respiro,
 * título serif itálico, carrossel horizontal com pré-visualização do slide seguinte,
 * setas discretas por baixo, texto do corpo; barra inferior DESIGN/DEV/SOBRE/CV;
 * botão voltar quadrado preto à direita (referência visual).
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
        "relative min-h-svh bg-white pb-[calc(3.5rem+env(safe-area-inset-bottom))] text-stone-950 antialiased",
        className,
      )}
    >
      <a
        href="#conteudo-projeto"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded focus:bg-stone-900 focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Saltar para o conteúdo
      </a>

      <Link
        href="/#design"
        aria-label="Voltar à grelha de projetos"
        className={cn(
          "fixed right-3 top-1/2 z-40 flex size-9 -translate-y-1/2 items-center justify-center",
          "bg-stone-950 text-white shadow-sm transition-opacity hover:opacity-90",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950",
        )}
      >
        <CaretLeft className="size-4" weight="bold" aria-hidden />
      </Link>

      <main
        id="conteudo-projeto"
        className={cn(
          "relative mx-auto flex w-full max-w-[min(100%,36rem)] flex-col items-start gap-6",
          "pl-6 pr-14 pt-16 sm:pl-10 sm:pr-16 sm:pt-20 md:pl-16 md:pr-20 lg:pl-24",
        )}
      >
        <header className="flex w-full flex-col items-start text-left">
          <h1 className="m-0 w-full p-0 text-left font-normal">
            <Link
              href="/#design"
              className={cn(
                "inline-block max-w-full text-balance font-serif text-[14px] font-normal italic leading-[1.35] text-stone-950",
                "outline-none transition-opacity hover:opacity-70",
                "focus-visible:ring-2 focus-visible:ring-stone-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white",
              )}
            >
              {project.title}
            </Link>
          </h1>
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
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-between gap-1",
          "border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)]",
          "px-2 sm:px-6",
        )}
      >
        {bottomNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 items-center justify-center py-2.5",
              "font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-stone-950",
              "transition-colors hover:bg-neutral-100/90",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
