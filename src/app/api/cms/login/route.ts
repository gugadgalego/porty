import { NextResponse } from "next/server";
import {
  CMS_SESSION_COOKIE,
  getCmsPassword,
  safeEqualPassword,
  signSessionToken,
} from "@/lib/cms-auth";

export async function POST(req: Request) {
  let body: { password?: string };
  try {
    body = (await req.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const password = body.password ?? "";
  if (!safeEqualPassword(password, getCmsPassword())) {
    return NextResponse.json({ error: "Senha incorreta" }, { status: 401 });
  }
  const token = signSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CMS_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
