"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass = cn(
  "w-full rounded-none border border-border bg-background px-3 py-2 font-mono text-[13px]",
  "outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
);

export function AdminLoginForm() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/cms/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push("/admin/cms");
      router.refresh();
    } catch {
      setError("Erro de rede. Tenta de novo.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center px-6 py-16">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        Porty
      </p>
      <h1 className="mt-2 font-serif text-2xl font-light tracking-tight">
        CMS do portfólio
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Introduz a senha para editar os projetos que aparecem em Design.
      </p>

      <form onSubmit={onSubmit} className="mt-10 space-y-4">
        <div className="space-y-2">
          <label htmlFor="cms-password" className="block font-mono text-[12px]">
            Senha
          </label>
          <input
            id="cms-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            disabled={pending}
            required
          />
        </div>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-3 pt-2">
          <Button type="submit" disabled={pending}>
            {pending ? "A entrar…" : "Entrar"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/">Voltar ao site</Link>
          </Button>
        </div>
      </form>
    </main>
  );
}
