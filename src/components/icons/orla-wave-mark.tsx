import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logos Orla nos PNGs em `public/brands/` (`orla-light.png` / `orla-dark.png`).
 */
export function OrlaWaveMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative block h-7 w-7 shrink-0", className)}
      aria-hidden
    >
      <Image
        src="/brands/orla-light.png"
        alt=""
        fill
        sizes="56px"
        quality={100}
        unoptimized
        className="object-contain dark:hidden"
        draggable={false}
      />
      <Image
        src="/brands/orla-dark.png"
        alt=""
        fill
        sizes="56px"
        quality={100}
        unoptimized
        className="hidden object-contain dark:block"
        draggable={false}
      />
    </span>
  );
}
