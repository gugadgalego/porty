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
import { cn } from "@/lib/utils";

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

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/cms/projects", {
          cache: "no-store",
          credentials: "include",
        });
        if (res.status === 401) {
          if (!cancelled) router.push("/admin");
          return;
        }
        const data = (await res.json()) as { projects?: PortfolioProject[] };
        if (!cancelled && Array.isArray(data.projects)) {
          const list =
            data.projects.length > 0 ? data.projects : [emptyProject(0)];
          setProjects(list);
          setSelected(0);
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

          <CmsProjectWorkspace project={current} onChange={updateSelected} />
        </div>
      </main>
    </div>
  );
}
