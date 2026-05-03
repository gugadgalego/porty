import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CMS_SESSION_COOKIE, verifySessionToken } from "@/lib/cms-auth";

export default async function AdminCmsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const c = await cookies();
  if (!verifySessionToken(c.get(CMS_SESSION_COOKIE)?.value)) {
    redirect("/admin");
  }
  return <>{children}</>;
}
