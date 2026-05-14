import { cn } from "@/lib/utils";

/**
 * Camada da barra inferior: acima do conteúdo rolável, PullTab (~60) e hero header (40),
 * para ficar sempre visível no viewport sem scroll.
 */
export const SITE_BOTTOM_NAV_LAYER_CLASS = "z-[100]";

/**
 * Barra fixa no fundo do ecrã (`fixed bottom-0` no `<nav>`).
 * Base e blur mascarados para dissolver o conteúdo por trás sem criar limite visível no topo.
 */
export const SITE_BOTTOM_NAV_FIXED_SHELL_CLASS = cn(
  /* Sem `position` aqui — `fixed` vem no `<nav>`; `relative` anularia o `fixed` com `tailwind-merge`. */
  "isolate overflow-visible border-0 bg-transparent shadow-none",
  "before:pointer-events-none before:absolute before:inset-x-0 before:-top-28 before:bottom-0 before:z-0",
  "before:bg-transparent before:backdrop-blur-2xl before:backdrop-saturate-125 before:backdrop-brightness-110",
  "dark:before:backdrop-blur-lg dark:before:backdrop-saturate-100 dark:before:backdrop-brightness-75",
  "before:[mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.08)_18%,rgba(0,0,0,0.5)_46%,black_72%,black_100%)]",
  "before:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.08)_18%,rgba(0,0,0,0.5)_46%,black_72%,black_100%)]",
  "dark:before:[mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.06)_24%,rgba(0,0,0,0.36)_52%,black_78%,black_100%)]",
  "dark:before:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.06)_24%,rgba(0,0,0,0.36)_52%,black_78%,black_100%)]",
  "after:pointer-events-none after:absolute after:inset-x-0 after:-top-28 after:bottom-0 after:z-0 after:bg-background",
  "after:[mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.1)_20%,rgba(0,0,0,0.7)_58%,black_82%,black_100%)]",
  "after:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.1)_20%,rgba(0,0,0,0.7)_58%,black_82%,black_100%)]",
  "dark:after:[mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.28)_16%,rgba(0,0,0,0.86)_42%,black_62%,black_100%)]",
  "dark:after:[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.28)_16%,rgba(0,0,0,0.86)_42%,black_62%,black_100%)]",
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
