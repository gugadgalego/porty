import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CMS_SESSION_COOKIE, verifySessionToken } from "@/lib/cms-auth";
import { AdminLoginForm } from "./login-form";

export default async function AdminLoginPage() {
  const c = await cookies();
  if (verifySessionToken(c.get(CMS_SESSION_COOKIE)?.value)) {
    redirect("/admin/cms");
  }
  return <AdminLoginForm />;
}
