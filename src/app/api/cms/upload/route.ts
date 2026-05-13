import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CMS_SESSION_COOKIE, verifySessionToken } from "@/lib/cms-auth";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Vídeos da página Sobre (CMS); limite generoso para clips curtos. */
const MAX_VIDEO_BYTES = 120 * 1024 * 1024;

const IMAGE_MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const VIDEO_MIME_EXT: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/ogg": ".ogg",
  "video/quicktime": ".mov",
};

function videoExtFromFileName(name: string): string | null {
  const m = /\.([a-z0-9]+)$/i.exec(name.trim());
  if (!m) return null;
  const ext = `.${m[1].toLowerCase()}`;
  if ([".mp4", ".webm", ".ogg", ".mov"].includes(ext)) return ext;
  return null;
}

function resolveVideoExtension(file: File): string | null {
  const byMime = VIDEO_MIME_EXT[file.type];
  if (byMime) return byMime;
  return videoExtFromFileName(file.name);
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const tok = cookieStore.get(CMS_SESSION_COOKIE)?.value;
  if (!verifySessionToken(tok)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Form inválido" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Ficheiro em falta" }, { status: 400 });
  }

  const kindRaw = String(form.get("kind") ?? "image").toLowerCase();
  const isVideo = kindRaw === "video";

  if (isVideo) {
    if (file.size > MAX_VIDEO_BYTES) {
      return NextResponse.json(
        { error: "Vídeo demasiado grande (máx. 120MB)" },
        { status: 413 },
      );
    }
    const ext = resolveVideoExtension(file);
    if (!ext) {
      return NextResponse.json(
        { error: "Vídeo não suportado (usa MP4, WebM, OGG ou MOV)" },
        { status: 415 },
      );
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const name = `${randomBytes(16).toString("hex")}${ext}`;
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();

    if (blobToken) {
      try {
        const pathname = `sobre-videos/${name}`;
        const blob = await put(pathname, buf, {
          access: "public",
          token: blobToken,
          multipart: file.size >= 4.5 * 1024 * 1024,
          contentType:
            file.type ||
            (ext === ".mp4"
              ? "video/mp4"
              : ext === ".webm"
                ? "video/webm"
                : ext === ".ogg"
                  ? "video/ogg"
                  : "video/quicktime"),
        });
        return NextResponse.json({ url: blob.url });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao enviar para o Blob";
        return NextResponse.json({ error: msg }, { status: 500 });
      }
    }

    const dir = path.join(process.cwd(), "public", "cms-uploads", "videos");
    const full = path.join(dir, name);

    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(full, buf);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erro ao gravar";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const url = `/cms-uploads/videos/${name}`;
    return NextResponse.json({ url });
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return NextResponse.json(
      { error: "Ficheiro demasiado grande (máx. 8MB)" },
      { status: 413 },
    );
  }

  const ext = IMAGE_MIME_EXT[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Tipo não suportado (usa JPEG, PNG, WebP ou GIF)" },
      { status: 415 },
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const name = `${randomBytes(16).toString("hex")}${ext}`;
  const dir = path.join(process.cwd(), "public", "cms-uploads");
  const full = path.join(dir, name);

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(full, buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao gravar";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const url = `/cms-uploads/${name}`;
  return NextResponse.json({ url });
}
