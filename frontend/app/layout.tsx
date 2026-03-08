import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

import { Sidebar } from "@/components/sidebar";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AutoApply — AI Job Hunt",
  description: "Your AI-powered job application engine",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} ${spaceGrotesk.variable}`}>
        <Sidebar />
        <div className="relative z-10 ml-[240px] min-h-screen">{children}</div>
      </body>
    </html>
  );
}
