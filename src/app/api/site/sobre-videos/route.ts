import { NextResponse } from "next/server";
import {
  isSafeVideoUrl,
  readStoredSobreVideos,
} from "@/lib/sobre-cms-videos";

export const dynamic = "force-dynamic";

/** Lista pública de vídeos candidatos à página Sobre (URLs validadas). */
export async function GET() {
  const all = await readStoredSobreVideos();
  const videos = all.filter((v) => isSafeVideoUrl(v.url));
  return NextResponse.json({ videos });
}
