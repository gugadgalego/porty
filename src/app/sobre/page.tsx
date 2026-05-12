import type { Metadata } from "next";
import "remixicon/fonts/remixicon.css";
import { SobrePageClient } from "@/components/sobre-page-client";

export const metadata: Metadata = {
  title: "Sobre — Porty",
  robots: { index: true, follow: true },
};

export default function SobrePage() {
  return <SobrePageClient />;
}
