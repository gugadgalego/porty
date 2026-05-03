import { createHmac, timingSafeEqual } from "node:crypto";

export const CMS_SESSION_COOKIE = "portfolio_cms_session";

const MAX_AGE_S = 60 * 60 * 24 * 7;

export function getSessionSecret(): string {
  return process.env.CMS_SESSION_SECRET ?? "porty-cms-dev-secret";
}

/** Senha do CMS; em produção defina `PORTFOLIO_CMS_PASSWORD` no ambiente. */
export function getCmsPassword(): string {
  return process.env.PORTFOLIO_CMS_PASSWORD ?? "Coxinha123";
}

export function signSessionToken(): string {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_S;
  const payload = String(exp);
  const sig = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const i = token.lastIndexOf(".");
  if (i <= 0) return false;
  const payload = token.slice(0, i);
  const sig = token.slice(i + 1);
  const expected = createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("hex");
  if (sig.length !== expected.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex")))
      return false;
  } catch {
    return false;
  }
  const exp = Number(payload);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  return true;
}

export function safeEqualPassword(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  try {
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
