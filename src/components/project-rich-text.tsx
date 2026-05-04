"use client";

import * as React from "react";
import DOMPurify from "isomorphic-dompurify";
import { cn } from "@/lib/utils";

type Props = { html: string; className?: string; variant?: "default" | "paper" };

export function ProjectRichText({ html, className, variant = "default" }: Props) {
  const safe = React.useMemo(
    () =>
      DOMPurify.sanitize(html, {
        USE_PROFILES: { html: true },
      }),
    [html],
  );
  const paper = variant === "paper";
  return (
    <div
      className={cn(
        "portfolio-rich max-w-2xl font-serif text-[15px] leading-relaxed text-foreground/90",
        paper &&
          "portfolio-rich--paper max-w-none text-left text-[14px] font-light leading-[1.5] text-balance text-foreground",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: safe }}
    />
  );
}
