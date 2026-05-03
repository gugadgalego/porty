"use client";

import * as React from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import type { ProjectCarouselSlide } from "@/lib/portfolio-project";
import { cn } from "@/lib/utils";

type Props = {
  slides: ProjectCarouselSlide[];
  className?: string;
  variant?: "default" | "paper";
};

export function ProjectCarousel({
  slides,
  className,
  variant = "default",
}: Props) {
  const valid = slides.filter((s) => s.url.trim().length > 0);
  const [i, setI] = React.useState(0);
  const paper = variant === "paper";

  React.useEffect(() => {
    setI((prev) => Math.min(prev, Math.max(0, valid.length - 1)));
  }, [valid.length]);

  if (valid.length === 0) return null;

  const cur = valid[Math.min(i, valid.length - 1)];

  const next = () =>
    setI((v) =>
      paper ? Math.min(v + 1, valid.length - 1) : (v + 1) % valid.length,
    );
  const prev = () =>
    setI((v) =>
      paper ? Math.max(v - 1, 0) : (v - 1 + valid.length) % valid.length,
    );

  if (paper) {
    return (
      <div className={cn("w-full", className)}>
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-stone-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cur.url}
            alt={cur.alt ?? ""}
            className="h-full w-full object-cover"
          />
        </div>
        {valid.length > 1 ? (
          <div className="mt-2 flex items-center justify-start gap-2">
            <Button
              type="button"
              variant="ghost"
              aria-label="Anterior"
              disabled={i <= 0}
              onClick={prev}
              className={cn(
                "size-auto min-h-0 rounded-none border-0 bg-transparent px-1.5 py-1 shadow-none hover:bg-stone-100",
                "outline outline-1 -outline-offset-1 transition-[color,outline-color]",
                i <= 0 ? "outline-[#E5E5E5]" : "outline-[#D4D4D4]",
              )}
            >
              <CaretLeft
                className={cn(
                  "size-4",
                  i <= 0 ? "text-[#78716C]" : "text-[#0C0A09]",
                )}
                weight="regular"
              />
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-label="Seguinte"
              disabled={i >= valid.length - 1}
              onClick={next}
              className={cn(
                "size-auto min-h-0 rounded-none border-0 bg-transparent px-1.5 py-1 shadow-none hover:bg-stone-100",
                "outline outline-1 -outline-offset-1 transition-[color,outline-color]",
                i >= valid.length - 1 ? "outline-[#E5E5E5]" : "outline-[#D4D4D4]",
              )}
            >
              <CaretRight
                className={cn(
                  "size-4",
                  i >= valid.length - 1 ? "text-[#78716C]" : "text-[#0C0A09]",
                )}
                weight="regular"
              />
            </Button>
          </div>
        ) : null}
        {valid.length > 1 ? (
          <div className="mt-3 flex justify-start gap-1.5">
            {valid.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                className={cn(
                  "size-2 rounded-full transition-colors",
                  idx === Math.min(i, valid.length - 1)
                    ? "bg-stone-950"
                    : "bg-stone-400/40 hover:bg-stone-400/70",
                )}
                onClick={() => setI(idx)}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={cn("relative w-full max-w-3xl", className)}>
      <div className="relative overflow-hidden border border-border bg-muted/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cur.url}
          alt={cur.alt ?? ""}
          className="mx-auto max-h-[min(70vh,520px)] w-full object-contain"
        />
        {valid.length > 1 ? (
          <>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-2 top-1/2 z-10 size-9 -translate-y-1/2 rounded-none border border-border bg-background/90 shadow-sm"
              aria-label="Anterior"
              onClick={prev}
            >
              <CaretLeft className="size-4" weight="bold" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-1/2 z-10 size-9 -translate-y-1/2 rounded-none border border-border bg-background/90 shadow-sm"
              aria-label="Seguinte"
              onClick={next}
            >
              <CaretRight className="size-4" weight="bold" />
            </Button>
          </>
        ) : null}
      </div>
      {valid.length > 1 ? (
        <div className="mt-3 flex justify-center gap-1.5">
          {valid.map((_, idx) => (
            <button
              key={idx}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              className={cn(
                "size-2 rounded-full transition-colors",
                idx === Math.min(i, valid.length - 1)
                  ? "bg-foreground"
                  : "bg-muted-foreground/35 hover:bg-muted-foreground/55",
              )}
              onClick={() => setI(idx)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
