import { NextResponse } from "next/server";
import {
  isAvailableSiteVideoUrl,
  readStoredSobreVideos,
} from "@/lib/sobre-cms-videos";

export const dynamic = "force-dynamic";

/** Lista pública de vídeos candidatos à página Sobre (URLs validadas). */
export async function GET() {
  const all = await readStoredSobreVideos();
  const available = await Promise.all(
    all.map(async (v) => ((await isAvailableSiteVideoUrl(v.url)) ? v : null)),
  );
  const videos = available.filter((v) => v !== null);
  return NextResponse.json({ videos });
}
