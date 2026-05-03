import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CMS_SESSION_COOKIE, verifySessionToken } from "@/lib/cms-auth";

const MAX_BYTES = 8 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

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
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Ficheiro demasiado grande (máx. 8MB)" }, { status: 413 });
  }

  const ext = MIME_EXT[file.type];
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
