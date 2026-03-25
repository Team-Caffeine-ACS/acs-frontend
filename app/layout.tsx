import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import ThemeRegistry from "./ThemeRegistry"; // ← lisa see

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pääsla infosüsteem",
  description: "ACS-Frontend operatiivne vaade",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="et">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <ThemeRegistry>   {/* ← PAKI KÕIK SELLE SISSE */}
          <div className="flex h-screen overflow-hidden">
            <AppSidebar />

            <div className="flex flex-1 flex-col overflow-hidden">
              <AppHeader />

              <main className="flex-1 overflow-y-auto p-8">
                {children}
              </main>
            </div>
          </div>
        </ThemeRegistry>
      </body>
    </html>
  );
}