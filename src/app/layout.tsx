import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { getSiteSettings } from "@/lib/queries/site-settings";
import { SITE_URL } from "@/lib/seo/constants";
import "./globals.css";

const fontBrand = Bricolage_Grotesque({
  variable: "--font-brand",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Kavcom Expert",
    template: "%s",
  },
  description:
    "Full-service digital agency for websites, SEO, AEO/GEO, and growth marketing.",
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/feed.xml", title: "RSS" }],
      "text/plain": [{ url: "/llms.txt", title: "llms.txt" }],
    },
  },
  // Icons come from the app/ file conventions: favicon.ico, icon.png, apple-icon.png.
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Admin-configurable default (Settings → General). Visitors who used the
  // theme toggle keep their stored preference; next-themes' pre-paint script
  // corrects the class before first render, so there is no flash.
  const { defaultTheme } = await getSiteSettings();

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontBrand.variable}${defaultTheme === "dark" ? " dark" : ""} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          enableSystem={defaultTheme === "system"}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
