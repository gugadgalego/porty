"use client";

import type { PortfolioProject, ProjectBlock } from "@/lib/portfolio-project";
import { useLanguage } from "@/components/providers/language-provider";
import { cn } from "@/lib/utils";
import { ProjectCarousel } from "@/components/project-carousel";
import { ProjectRichText } from "@/components/project-rich-text";

type Props = {
  project: PortfolioProject;
  className?: string;
  /** Sem cabeçalho (título/subtítulo) — útil quando o pai replica o frame Paper. */
  omitHeader?: boolean;
  /** Tipografia e ritmo alinhados ao artboard «Projeto» no Paper. */
  variant?: "default" | "paper";
};

function spacerClass(size: "sm" | "md" | "lg") {
  if (size === "sm") return "h-4";
  if (size === "lg") return "h-16";
  return "h-10";
}

export function ProjectDetailPanel({
  project,
  className,
  omitHeader = false,
  variant = "default",
}: Props) {
  const { dictionary } = useLanguage();
  const blocks = project.blocks ?? [];
  const paper = variant === "paper";

  return (
    <article
      id={project.id}
      className={cn(
        "scroll-mt-[max(5rem,env(safe-area-inset-top))] border-t border-border pt-10 pb-16",
        paper && "border-t-0 pt-0 pb-20",
        className,
      )}
    >
      {!omitHeader ? (
        <header className="mx-auto max-w-2xl border-b border-border pb-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            Projeto
          </p>
          <h2 className="mt-2 font-serif text-2xl font-light tracking-tight text-foreground md:text-3xl">
            {project.title}
          </h2>
          {project.subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {project.subtitle}
            </p>
          ) : null}
        </header>
      ) : null}

      <div
        className={cn(
          "mx-auto mt-10 max-w-2xl space-y-10",
          paper && "mt-0 max-w-none space-y-6",
        )}
      >
        {blocks.length === 0 ? (
          <p
            className={cn(
              "text-sm text-muted-foreground",
              paper && "text-left text-[13px] text-muted-foreground",
            )}
          >
            {dictionary.projectEmptyCms}
          </p>
        ) : (
          blocks.map((block: ProjectBlock) => {
            if (block.type === "text") {
              return (
                <ProjectRichText
                  key={block.id}
                  html={block.html}
                  className={paper ? "max-w-none" : undefined}
                  variant={paper ? "paper" : "default"}
                />
              );
            }
            if (block.type === "spacer") {
              return (
                <div
                  key={block.id}
                  aria-hidden
                  className={spacerClass(block.size)}
                />
              );
            }
            if (block.type === "image") {
              if (!block.url.trim()) return null;
              if (block.placement === "hero") return null;
              return (
                <figure key={block.id} className="space-y-2">
                  {paper ? (
                    <div className="aspect-[3/2] w-full overflow-hidden border border-border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={block.url}
                        alt={block.caption ?? ""}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={block.url}
                      alt={block.caption ?? ""}
                      className="w-full border border-border object-cover"
                    />
                  )}
                  {block.caption ? (
                    <figcaption
                      className={cn(
                        "text-center font-mono text-[11px] text-muted-foreground",
                        paper && "text-left",
                      )}
                    >
                      {block.caption}
                    </figcaption>
                  ) : null}
                </figure>
              );
            }
            if (block.type === "carousel") {
              return (
                <ProjectCarousel
                  key={block.id}
                  slides={block.slides}
                  variant={paper ? "paper" : "default"}
                />
              );
            }
            return null;
          })
        )}
      </div>
    </article>
  );
}
