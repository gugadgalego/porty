"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CmsProjectWorkspace } from "@/components/cms/cms-project-workspace";
import {
  defaultPortfolioProjects,
  type PortfolioProject,
} from "@/lib/portfolio-project";
import { uploadCmsVideo } from "@/lib/cms-upload-client";
import type { SobreCmsVideo } from "@/lib/sobre-cms-videos";
import { cn } from "@/lib/utils";

function emptySobreVideoRow(i: number): SobreCmsVideo {
  return { id: `clip-${i + 1}`, url: "" };
}

function emptyProject(i: number): PortfolioProject {
  return {
    id: `p${i + 1}`,
    title: "",
    subtitle: "",
    image: "",
    blocks: [],
    /** Por defeito visível no site; desmarca no CMS para rascunho. */
    implemented: true,
  };
}

export default function AdminCmsPage() {
  const router = useRouter();
  const [projects, setProjects] = React.useState<PortfolioProject[]>([]);
  const [selected, setSelected] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [sobreVideos, setSobreVideos] = React.useState<SobreCmsVideo[]>([]);
  const [savingSobre, setSavingSobre] = React.useState(false);
  const [sobreMessage, setSobreMessage] = React.useState<string | null>(null);
  const sobreVideoFileRef = React.useRef<HTMLInputElement>(null);
  const sobreVideoRowRef = React.useRef(0);
  const [sobreUploadRow, setSobreUploadRow] = React.useState<number | null>(
    null,
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [resProjects, resSobre] = await Promise.all([
          fetch("/api/cms/projects", {
            cache: "no-store",
            credentials: "include",
          }),
          fetch("/api/cms/sobre-videos", {
            cache: "no-store",
            credentials: "include",
          }),
        ]);
        if (resProjects.status === 401) {
          if (!cancelled) router.push("/admin");
          return;
        }
        const data = (await resProjects.json()) as {
          projects?: PortfolioProject[];
        };
        if (!cancelled && Array.isArray(data.projects)) {
          const list =
            data.projects.length > 0 ? data.projects : [emptyProject(0)];
          setProjects(list);
          setSelected(0);
        }

        if (resSobre.ok) {
          const sv = (await resSobre.json()) as { videos?: SobreCmsVideo[] };
          const vids = Array.isArray(sv.videos) ? sv.videos : [];
          if (!cancelled) {
            setSobreVideos(
              vids.length > 0 ? vids : [emptySobreVideoRow(0)],
            );
          }
        } else if (!cancelled) {
          setSobreVideos([emptySobreVideoRow(0)]);
        }
      } catch {
        if (!cancelled) setError("Não foi possível carregar os projetos.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  React.useEffect(() => {
    if (selected >= projects.length) {
      setSelected(Math.max(0, projects.length - 1));
    }
  }, [selected, projects.length]);

  function updateSelected(next: PortfolioProject) {
    setProjects((prev) =>
      prev.map((p, i) => (i === selected ? next : p)),
    );
  }

  function addProject() {
    setProjects((prev) => [...prev, emptyProject(prev.length)]);
    setSelected((prev) => prev + 1);
  }

  function removeSelected() {
    if (projects.length <= 1) return;
    setProjects((prev) => prev.filter((_, i) => i !== selected));
    setSelected((s) => Math.max(0, s - 1));
  }

  async function onSave() {
    setMessage(null);
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/cms/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projects }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao gravar.");
        return;
      }
      setMessage("Alterações guardadas.");
      router.refresh();
    } catch {
      setError("Erro de rede ao gravar.");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveSobreVideos() {
    setSobreMessage(null);
    setError(null);
    setSavingSobre(true);
    const toSave = sobreVideos.filter((v) => v.url.trim().length > 0);
    try {
      const res = await fetch("/api/cms/sobre-videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ videos: toSave }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao gravar vídeos Sobre.");
        return;
      }
      setSobreMessage("Vídeos Sobre guardados.");
      router.refresh();
    } catch {
      setError("Erro de rede ao gravar vídeos Sobre.");
    } finally {
      setSavingSobre(false);
    }
  }

  function triggerSobreVideoPicker(rowIndex: number) {
    sobreVideoRowRef.current = rowIndex;
    sobreVideoFileRef.current?.click();
  }

  async function onSobreVideoFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const rowIndex = sobreVideoRowRef.current;
    setSobreUploadRow(rowIndex);
    setError(null);
    try {
      const url = await uploadCmsVideo(file);
      setSobreVideos((prev) =>
        prev.map((x, j) => (j === rowIndex ? { ...x, url } : x)),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload de vídeo falhou.",
      );
    } finally {
      setSobreUploadRow(null);
    }
  }

  async function onLogout() {
    await fetch("/api/cms/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  }

  function resetToDefaults() {
    if (
      !window.confirm(
        "Substituir todos os projetos pelos valores de exemplo do código? (Perdes o rascunho atual se não gravaste.)",
      )
    ) {
      return;
    }
    setProjects(structuredClone(defaultPortfolioProjects));
    setSelected(0);
    setMessage(null);
    setError(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-muted/20 font-mono text-sm text-muted-foreground">
        A carregar…
      </div>
    );
  }

  const current = projects[selected];
  if (!current) {
    return null;
  }

  return (
    <div className="flex min-h-svh flex-col bg-[color-mix(in_oklab,var(--muted)_28%,var(--background))] lg:flex-row">
      <aside className="flex w-full shrink-0 flex-col border-b border-border bg-card lg:w-[280px] lg:border-b-0 lg:border-r">
        <div className="flex flex-col gap-1 border-b border-border p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Porty CMS
          </p>
          <h1 className="font-serif text-xl font-light tracking-tight">
            Projetos
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-none font-mono text-[11px]"
              onClick={() => void onSave()}
              disabled={saving}
            >
              {saving ? "A gravar…" : "Guardar tudo"}
            </Button>
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/" className="rounded-none font-mono text-[11px]">
                Site
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-none font-mono text-[11px]"
              onClick={() => void onLogout()}
            >
              Sair
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
          {projects.map((p, i) => (
            <button
              key={`${p.id}-${i}`}
              type="button"
              onClick={() => setSelected(i)}
              className={cn(
                "rounded-none border px-3 py-2.5 text-left transition-colors",
                i === selected
                  ? "border-foreground/25 bg-foreground text-background"
                  : "border-transparent bg-transparent hover:bg-muted/80",
              )}
            >
              <span className="block truncate font-mono text-[10px] opacity-70">
                #{p.id || "—"}
              </span>
              <span className="mt-0.5 block truncate font-serif text-sm font-light">
                {p.title || "Sem título"}
              </span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-none font-mono text-[11px]"
            onClick={addProject}
          >
            + Novo projeto
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full rounded-none font-mono text-[11px]"
            onClick={removeSelected}
            disabled={projects.length <= 1}
          >
            Remover projeto
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full rounded-none font-mono text-[10px] text-muted-foreground"
            onClick={resetToDefaults}
          >
            Repor exemplo
          </Button>
        </div>
      </aside>

      <main className="min-h-0 flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          {error ? (
            <p className="mb-6 rounded-none border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="mb-6 rounded-none border border-border bg-muted/50 px-4 py-3 text-sm text-foreground">
              {message}
            </p>
          ) : null}

          <section className="mb-10 rounded-none border border-border bg-card/50 p-5">
            <h2 className="font-serif text-lg font-light tracking-tight text-foreground">
              Vídeos — página Sobre
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Carrega um ficheiro de vídeo (MP4, WebM, OGG ou MOV, até 120MB) ou
              cola um caminho em{" "}
              <code className="font-mono text-[11px]">public/</code> (ex.{" "}
              <code className="font-mono text-[11px]">/videos/clip.mp4</code>).
              Os uploads ficam em{" "}
              <code className="font-mono text-[11px]">
                /cms-uploads/videos/
              </code>
              . Em cada sessão de browser é escolhido um clip ao acaso desta
              lista.
            </p>
            {sobreMessage ? (
              <p className="mt-4 rounded-none border border-border bg-muted/40 px-3 py-2 font-mono text-[11px] text-foreground">
                {sobreMessage}
              </p>
            ) : null}
            <div className="mt-5 space-y-4">
              {sobreVideos.map((v, i) => (
                <div
                  key={i}
                  className="rounded-none border border-border/70 bg-background/30 p-4"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        Id
                      </span>
                      <input
                        className="rounded-none border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
                        value={v.id}
                        onChange={(e) => {
                          const t = e.target.value;
                          setSobreVideos((prev) =>
                            prev.map((x, j) =>
                              j === i ? { ...x, id: t } : x,
                            ),
                          );
                        }}
                      />
                    </label>
                    <label className="grid min-w-0 gap-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        URL (preenchido ao carregar)
                      </span>
                      <input
                        className="min-w-0 rounded-none border border-border bg-background px-2 py-1.5 font-mono text-xs text-foreground"
                        value={v.url}
                        placeholder="/cms-uploads/videos/…"
                        onChange={(e) => {
                          const t = e.target.value;
                          setSobreVideos((prev) =>
                            prev.map((x, j) =>
                              j === i ? { ...x, url: t } : x,
                            ),
                          );
                        }}
                      />
                    </label>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-none font-mono text-[11px]"
                      disabled={sobreUploadRow !== null || savingSobre}
                      onClick={() => triggerSobreVideoPicker(i)}
                    >
                      {sobreUploadRow === i ? "A carregar…" : "Carregar vídeo"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="rounded-none font-mono text-[11px]"
                      disabled={sobreVideos.length <= 1}
                      onClick={() =>
                        setSobreVideos((prev) =>
                          prev.filter((_, j) => j !== i),
                        )
                      }
                    >
                      Remover linha
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <input
              ref={sobreVideoFileRef}
              type="file"
              className="sr-only"
              accept="video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.ogg,.mov"
              aria-hidden
              tabIndex={-1}
              onChange={(e) => void onSobreVideoFileChange(e)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-none font-mono text-[11px]"
                disabled={sobreUploadRow !== null}
                onClick={() =>
                  setSobreVideos((prev) => [
                    ...prev,
                    emptySobreVideoRow(prev.length),
                  ])
                }
              >
                + Vídeo
              </Button>
              <Button
                type="button"
                size="sm"
                className="rounded-none font-mono text-[11px]"
                disabled={savingSobre || sobreUploadRow !== null}
                onClick={() => void onSaveSobreVideos()}
              >
                {savingSobre ? "A gravar…" : "Guardar vídeos Sobre"}
              </Button>
            </div>
          </section>

          <CmsProjectWorkspace project={current} onChange={updateSelected} />
        </div>
      </main>
    </div>
  );
}
