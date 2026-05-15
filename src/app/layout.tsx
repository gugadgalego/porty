import type { Metadata } from "next";
import { Source_Serif_4, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { AppSiteBottomNav } from "@/components/app-site-bottom-nav";
import { PullTab } from "@/components/pull-tab";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  PORTFOLIO_HOME_INTRO_SEEN_KEY,
  PORTFOLIO_NAV_ROUTE_TO_DESIGN_KEY,
} from "@/lib/site-bottom-nav-motion";

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "400", "500"],
});

const sourceCode = Source_Code_Pro({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Guga — Designer & Dev",
  description:
    "Portfólio de Gustavo Galego (Guga). Produtos com foco em simplicidade, praticidade e atenção aos detalhes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        sourceSerif.variable,
        sourceCode.variable,
      )}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var designKey=${JSON.stringify(PORTFOLIO_NAV_ROUTE_TO_DESIGN_KEY)};var introKey=${JSON.stringify(PORTFOLIO_HOME_INTRO_SEEN_KEY)};var params=new URLSearchParams(window.location.search);var wantsDesign=window.location.hash==="#design"||params.get("view")==="design"||window.sessionStorage.getItem(designKey)==="1";var introSeen=window.sessionStorage.getItem(introKey)==="1";if(wantsDesign||introSeen){document.documentElement.classList.add("porty-home-route-pending");}}catch(e){}})();`,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider defaultLocale="pt">
            <TooltipProvider delayDuration={180}>
              {children}
              <AppSiteBottomNav />
              <PullTab />
            </TooltipProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
