import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logos Mackenzie **exatamente** como os PNGs em `public/brands/`
 * (`mackenzie-light.png` / `mackenzie-dark.png`).
 */
export function MackenzieMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("relative block h-7 w-7 shrink-0", className)}
      aria-hidden
    >
      <Image
        src="/brands/mackenzie-light.png"
        alt=""
        fill
        sizes="56px"
        quality={100}
        unoptimized
        className="object-contain dark:hidden"
        draggable={false}
      />
      <Image
        src="/brands/mackenzie-dark.png"
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
