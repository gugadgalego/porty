"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";

/** Mesmas classes da barra inferior da home (`renderNavButtons` scope bottom). */
export const SITE_BOTTOM_NAV_CONTAINER_CLASS = cn(
  "flex w-full items-stretch justify-center",
  "px-3 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1.5",
  "bg-background",
);

export function SiteBottomNav({ className }: { className?: string }) {
  const { dictionary, locale } = useLanguage();
  const sections = [
    { label: dictionary.sections.design, href: "/#design" },
    { label: dictionary.sections.dev, href: "/#dev" },
    { label: dictionary.sections.about, href: "/#sobre" },
    { label: dictionary.sections.cv, href: "/#cv" },
  ];

  return (
    <nav
      key={locale}
      aria-label="Secções do site"
      className={cn(
        SITE_BOTTOM_NAV_CONTAINER_CLASS,
        "fixed inset-x-0 bottom-0 z-30 pointer-events-auto",
        className,
      )}
    >
      {sections.map((s) => (
        <div key={s.href} className="flex-1">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="w-full font-mono text-[12px] tracking-wide"
          >
            <Link href={s.href}>{s.label}</Link>
          </Button>
        </div>
      ))}
    </nav>
  );
}
