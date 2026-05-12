import { cn } from "@/lib/utils";

/** Botões de navegação de frame/carrossel (Sobre + projeto paper). */
export const carouselFrameNavButtonClass = cn(
  "size-auto min-h-0 rounded-none border-0 bg-transparent px-1.5 py-1 shadow-none",
  "outline outline-1 -outline-offset-1 transition-[color,outline-color]",
  "hover:bg-stone-100 dark:hover:bg-muted/50",
);

export const carouselFrameNavOutlineActive =
  "outline-[#D4D4D4] dark:outline-muted-foreground/40";

export const carouselFrameNavOutlineDisabled =
  "outline-[#E5E5E5] dark:outline-border";

export const carouselFrameNavIconActive =
  "text-[#0C0A09] dark:text-foreground";

export const carouselFrameNavIconDisabled =
  "text-[#78716C] dark:text-muted-foreground";
