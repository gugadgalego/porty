"use client";

import { useState } from "react";
import { CoverFlow, type CoverFlowItem } from "@/components/ui/coverflow";

const FRAME_BACKGROUND = "url(/images/shader-frame-bg.png)";

const COVERFLOW_APPLE_PRESET = {
  itemWidth: 192,
  itemHeight: 192,
  stackSpacing: 29,
  centerGap: 86,
  rotation: 67,
  enableReflection: true,
  enableClickToSnap: true,
  enableScroll: true,
  scrollThreshold: 48,
} as const;

const COVERFLOW_ITEMS: CoverFlowItem[] = [
  {
    id: "1",
    image:
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    title: "Montanhas",
    subtitle: "Paisagem",
  },
  {
    id: "2",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
    title: "Natureza",
    subtitle: "Floresta",
  },
  {
    id: "3",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
    title: "Trilha",
    subtitle: "Outono",
  },
  {
    id: "4",
    image:
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80",
    title: "Campo",
    subtitle: "Neblina",
  },
];

export function SobreCoverflowFrame() {
  const [flowIndex, setFlowIndex] = useState(0);

  return (
    <div className="relative isolate size-full min-h-0 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: FRAME_BACKGROUND }}
      />
      <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden p-2">
        <CoverFlow
          items={COVERFLOW_ITEMS}
          {...COVERFLOW_APPLE_PRESET}
          initialIndex={flowIndex}
          onIndexChange={setFlowIndex}
          className="h-full max-h-full min-h-0 w-full max-w-full [&_h3]:!text-white [&_h3]:drop-shadow-md [&_p]:!text-white/80"
        />
      </div>
    </div>
  );
}
