import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CMS — Porty",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-svh bg-background text-foreground antialiased">
      {children}
    </div>
  );
}
