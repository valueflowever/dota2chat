import type { Metadata } from "next";
import { IBM_Plex_Mono, Manrope } from "next/font/google";

import "./globals.css";

const manrope = Manrope({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Ancient Lens | Dota 2 录像解析台",
  description:
    "用于 Dota 2 录像复盘、节奏分析和 AI 辅助拆解的聊天式分析工作台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
