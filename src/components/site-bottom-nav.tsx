"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { MagneticNavUl } from "@/components/magnetic-nav-ul";

/** Mesmas classes da barra inferior da home (`renderNavButtons` scope bottom). */
export const SITE_BOTTOM_NAV_CONTAINER_CLASS = cn(
  "grid w-full list-none grid-cols-4 items-stretch gap-3",
  /* Padding uniforme; sem fundo no contentor — só hover nos botões (e highlight magnético). */
  "p-4",
);

/** Cada célula da grelha: `min-w-0` evita que o conteúdo force larguras desiguais. */
export const SITE_BOTTOM_NAV_ITEM_CLASS = "relative z-[1] min-w-0";

/** Hero + barra fixa + páginas com SiteBottomNav. `shrink` anula o `shrink-0` do `Button` para caber na célula. */
export const SITE_BOTTOM_NAV_BUTTON_CLASS = cn(
  "relative z-[1] min-w-0 w-full shrink rounded-none font-mono text-[12px] tracking-wide",
  "px-3",
  /* Sem borda em nenhum estado (inclui overrides do `Button` e do `border-border` global em `*`). */
  "border-0 hover:border-0 focus-visible:border-0 active:border-0 aria-expanded:border-0 aria-invalid:border-0",
  /* Ghost em light usa `hover:bg-muted` opaco — aqui fica mais suave e alinha com o highlight magnético. */
  "hover:bg-muted/50 dark:hover:bg-muted/50",
);

export function SiteBottomNav({ className }: { className?: string }) {
  const { dictionary, locale } = useLanguage();
  const sections = [
    { label: dictionary.sections.design, href: "/#design" },
    { label: dictionary.sections.dev, href: "/#dev" },
    { label: dictionary.sections.about, href: "/sobre" },
    { label: dictionary.sections.cv, href: "/#cv" },
  ];

  return (
    <nav
      key={locale}
      aria-label="Secções do site"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 pointer-events-auto",
        className,
      )}
    >
      <MagneticNavUl className={cn(SITE_BOTTOM_NAV_CONTAINER_CLASS)}>
        {sections.map((s) => (
          <li key={s.href} className={SITE_BOTTOM_NAV_ITEM_CLASS}>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className={SITE_BOTTOM_NAV_BUTTON_CLASS}
            >
              <Link href={s.href}>{s.label}</Link>
            </Button>
          </li>
        ))}
      </MagneticNavUl>
    </nav>
  );
}
