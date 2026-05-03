"use client";

import * as React from "react";
import { uploadCmsImage } from "@/lib/cms-upload-client";
import type { PortfolioProject } from "@/lib/portfolio-project";
import { cn } from "@/lib/utils";
import { CmsBlocksEditor } from "./cms-blocks-editor";

const fieldClass = cn(
  "w-full rounded-none border border-border bg-background px-3 py-2 font-mono text-[13px]",
  "outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
);

type Props = {
  project: PortfolioProject;
  onChange: (next: PortfolioProject) => void;
};

export function CmsProjectWorkspace({ project, onChange }: Props) {
  const [coverBusy, setCoverBusy] = React.useState(false);

  async function onCoverFile(file: File | null) {
    if (!file) return;
    setCoverBusy(true);
    try {
      const url = await uploadCmsImage(file);
      onChange({ ...project, image: url });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Upload falhou");
    } finally {
      setCoverBusy(false);
    }
  }

  return (
    <div className="space-y-10 pb-24">
      <section className="rounded-none border border-border bg-card p-5 shadow-sm">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Capa do cartão (grelha Design)
        </h2>
        <label className="mt-3 flex cursor-pointer items-center gap-2 font-mono text-[12px] text-foreground">
          <input
            type="checkbox"
            className="size-3.5 rounded-none border border-border accent-foreground"
            checked={project.implemented !== false}
            onChange={(e) =>
              onChange({ ...project, implemented: e.target.checked })
            }
          />
          Implementado / visível no portfólio público
        </label>
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,220px)_1fr]">
          <div className="space-y-2">
            {project.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.image}
                alt=""
                className="aspect-[464/320] w-full border border-border object-cover bg-muted/30"
              />
            ) : (
              <div className="flex aspect-[464/320] w-full items-center justify-center border border-dashed border-border bg-muted/20 text-center text-xs text-muted-foreground">
                Sem imagem
              </div>
            )}
            <label className="flex cursor-pointer justify-center rounded-none border border-border bg-muted/40 px-3 py-2 text-center font-mono text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                disabled={coverBusy}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  void onCoverFile(f ?? null);
                }}
              />
              {coverBusy ? "A enviar…" : "Enviar imagem de capa"}
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="block font-mono text-[11px] text-muted-foreground">
                id (âncora)
              </span>
              <input
                className={fieldClass}
                value={project.id}
                onChange={(e) =>
                  onChange({ ...project, id: e.target.value })
                }
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="block font-mono text-[11px] text-muted-foreground">
                URL da imagem de capa
              </span>
              <input
                className={fieldClass}
                value={project.image}
                onChange={(e) =>
                  onChange({ ...project, image: e.target.value })
                }
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="block font-mono text-[11px] text-muted-foreground">
                Título
              </span>
              <input
                className={fieldClass}
                value={project.title}
                onChange={(e) =>
                  onChange({ ...project, title: e.target.value })
                }
              />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="block font-mono text-[11px] text-muted-foreground">
                Subtítulo
              </span>
              <input
                className={fieldClass}
                value={project.subtitle}
                onChange={(e) =>
                  onChange({ ...project, subtitle: e.target.value })
                }
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-none border border-border bg-card p-5 shadow-sm">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Página do projeto
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Blocos aparecem por baixo da grelha em Design quando alguém abre o
          link do cartão (ex.: <span className="font-mono text-foreground">#p1</span>
          ). Arrasta pelo ícone à esquerda para reordenar.
        </p>
        <div className="mt-6">
          <CmsBlocksEditor
            blocks={project.blocks ?? []}
            onChange={(blocks) => onChange({ ...project, blocks })}
          />
        </div>
      </section>
    </div>
  );
}
