import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeRegistry from "./ThemeRegistry";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pääsla infosüsteem",
  description: "ACS-Frontend operatiivne vaade",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="et">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
