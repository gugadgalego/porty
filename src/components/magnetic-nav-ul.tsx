"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type Magnet = { x: number; y: number; w: number; h: number };

type MagneticNavUlProps = Omit<React.ComponentProps<"ul">, "children"> & {
  children: React.ReactNode;
  /** Se false, não desenha o highlight (ex.: nav do hero ainda invisível). */
  magnetEnabled?: boolean;
};

/**
 * Highlight cinzento que segue o item sob o rato/teclado.
 * Implementação simples: rect do `<li>` vs rect do `<ul>`, sem anchor positioning.
 */
export function MagneticNavUl({
  className,
  children,
  magnetEnabled = true,
  ...rest
}: MagneticNavUlProps) {
  const ulRef = React.useRef<HTMLUListElement>(null);
  const [magnet, setMagnet] = React.useState<Magnet | null>(null);

  const syncFromEvent = React.useCallback(
    (e: React.SyntheticEvent) => {
      if (!magnetEnabled) return;
      const ul = ulRef.current;
      if (!ul) return;
      const raw = e.target;
      const el =
        raw instanceof Element ? raw : (raw as Node).parentElement;
      if (!el) return;
      const li = el.closest("li");
      if (!li || !ul.contains(li)) return;
      const ur = ul.getBoundingClientRect();
      const lr = li.getBoundingClientRect();
      setMagnet({
        x: lr.left - ur.left + ul.scrollLeft,
        y: lr.top - ur.top + ul.scrollTop,
        w: lr.width,
        h: lr.height,
      });
    },
    [magnetEnabled],
  );

  const hide = React.useCallback(() => {
    if (magnetEnabled) setMagnet(null);
  }, [magnetEnabled]);

  React.useEffect(() => {
    if (!magnetEnabled) setMagnet(null);
  }, [magnetEnabled]);

  return (
    <ul
      ref={ulRef}
      className={cn("relative", className)}
      onMouseOver={syncFromEvent}
      onFocusCapture={syncFromEvent}
      onMouseLeave={hide}
      {...rest}
    >
      {magnetEnabled && magnet ? (
        <span
          aria-hidden
          className={cn(
            "pointer-events-none absolute z-0 bg-muted-foreground/18",
            "transition-[left,top,width,height,opacity] duration-200 ease-out",
            "motion-reduce:transition-none",
          )}
          style={{
            left: magnet.x,
            top: magnet.y,
            width: magnet.w,
            height: magnet.h,
          }}
        />
      ) : null}
      {children}
    </ul>
  );
}
