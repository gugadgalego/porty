import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CMS_SESSION_COOKIE, verifySessionToken } from "@/lib/cms-auth";
import {
  isSafeVideoUrl,
  normalizeSobreVideoInput,
  readStoredSobreVideos,
  writeStoredSobreVideos,
  type SobreCmsVideo,
} from "@/lib/sobre-cms-videos";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  const videos = await readStoredSobreVideos();
  return NextResponse.json({ videos });
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (!verifySessionToken(cookieStore.get(CMS_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const raw = (body as { videos?: unknown }).videos;
  if (!Array.isArray(raw)) {
    return NextResponse.json(
      { error: "`videos` deve ser um array" },
      { status: 400 },
    );
  }

  const videos: SobreCmsVideo[] = [];
  let i = 0;
  for (const item of raw) {
    const v = normalizeSobreVideoInput(item, i);
    if (!v) continue;
    if (!isSafeVideoUrl(v.url)) {
      return NextResponse.json(
        { error: `URL inválido ou não permitido: ${v.url}` },
        { status: 400 },
      );
    }
    const id = v.id.trim() || `video-${i + 1}`;
    videos.push({ id, url: v.url.trim() });
    i++;
  }

  const result = await writeStoredSobreVideos(videos);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
