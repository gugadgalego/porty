/** Alinhado à grelha Design em `page.tsx` (nav inferior ao abrir Design). */
export const SITE_BOTTOM_NAV_STAGGER_MS = 70;
export const SITE_BOTTOM_NAV_DURATION_MS = 420;
export const SITE_BOTTOM_NAV_EASE = "cubic-bezier(0.33, 1, 0.68, 1)";
export const SITE_BOTTOM_NAV_BUFFER_MS = 40;
export const PORTFOLIO_NAV_ROUTE_TO_DESIGN_KEY =
  "porty:portfolio-nav:route-to-design";

/** Hero ao abrir Design: mesmos ms/curva que `renderNavButtons` scope hero em `exiting`. */
export const PORTFOLIO_NAV_HERO_EXIT_DURATION_MS = 520;
export const PORTFOLIO_NAV_HERO_EXIT_EASE =
  "cubic-bezier(0.22, 1, 0.36, 1)";
export const PORTFOLIO_NAV_HERO_EXIT_TRANSLATE_PX = 6;

/**
 * Tempo até a fase “entering” na home (`openDesignGrid`) — gate entre saída do hero e entrada da nav inferior.
 * Reutilizar para sequência saída → entrada na `AppSiteBottomNav`.
 */
export function portfolioNavExitGateMs(itemCount: number): number {
  return (
    Math.max(0, itemCount - 1) * SITE_BOTTOM_NAV_STAGGER_MS +
    SITE_BOTTOM_NAV_DURATION_MS +
    SITE_BOTTOM_NAV_BUFFER_MS
  );
}

/** Duração total da cascata de entrada da nav inferior (último delay + duração + folga). */
export function portfolioNavEnterSequenceMs(itemCount: number): number {
  return portfolioNavExitGateMs(itemCount);
}
