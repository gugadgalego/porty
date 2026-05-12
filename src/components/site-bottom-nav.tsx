import { cn } from "@/lib/utils";

/**
 * Camada da barra inferior: acima do conteúdo rolável, PullTab (~60) e hero header (40),
 * para ficar sempre visível no viewport sem scroll.
 */
export const SITE_BOTTOM_NAV_LAYER_CLASS = "z-[100]";

/**
 * Barra fixa no fundo do ecrã (`fixed bottom-0` no `<nav>`).
 * Estilo alinhado ao botão “Project details” em vladsavruk.com: fundo na cor da página com
 * opacidade (~70%), `backdrop-blur-sm` e contorno muito suave (sem faixa extra em cima).
 */
export const SITE_BOTTOM_NAV_FIXED_SHELL_CLASS = cn(
  /* Sem `position` aqui — `fixed` vem no `<nav>`; `relative` anularia o `fixed` com `tailwind-merge`. */
  "isolate",
  "border-t border-x border-border/10",
  "bg-background/70 backdrop-blur-sm",
  "pb-[env(safe-area-inset-bottom,0px)]",
);

/** Mesmas classes da barra inferior da home (`renderNavButtons` scope bottom). */
export const SITE_BOTTOM_NAV_CONTAINER_CLASS = cn(
  "grid w-full list-none grid-cols-4 items-stretch gap-3",
  /* Padding uniforme compacto (p-2); fundo fosco no `<nav>` fixo (`SITE_BOTTOM_NAV_FIXED_SHELL_CLASS`). */
  "p-2",
);

/** Cada célula da grelha: `min-w-0` evita que o conteúdo force larguras desiguais. */
export const SITE_BOTTOM_NAV_ITEM_CLASS = "relative z-[1] min-w-0";

/** Hero + barra fixa + páginas com `AppSiteBottomNav`. `shrink` anula o `shrink-0` do `Button` para caber na célula. */
export const SITE_BOTTOM_NAV_BUTTON_CLASS = cn(
  "relative z-[1] min-w-0 w-full shrink rounded-none font-mono text-[12px] tracking-wide",
  "px-3",
  /* Sem borda em nenhum estado (inclui overrides do `Button` e do `border-border` global em `*`). */
  "border-0 hover:border-0 focus-visible:border-0 active:border-0 aria-expanded:border-0 aria-invalid:border-0",
  /* Ghost em light usa `hover:bg-muted` opaco — aqui fica mais suave e alinha com o highlight magnético. */
  "hover:bg-muted/50 dark:hover:bg-muted/50",
);
