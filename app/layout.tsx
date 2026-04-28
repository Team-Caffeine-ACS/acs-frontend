import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "./ThemeRegistry";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { getThemeInitializationScript } from "@/lib/theme";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pääsla infosüsteem",
  description: "ACS-Frontend operatiivne vaade",
  manifest: "/manifest.webmanifest",
  icons: {
    shortcut: "/favicon.ico",
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="et" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-slate-50 text-slate-900 antialiased transition-colors dark:bg-slate-950 dark:text-slate-50`}
      >
        <script dangerouslySetInnerHTML={{ __html: getThemeInitializationScript() }} />
        <ThemeRegistry>
          <ThemeProvider>{children}</ThemeProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}
