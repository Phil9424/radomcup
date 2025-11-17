import type { Metadata } from "next";
import { Inter, Geist_Mono } from 'next/font/google';
import "./globals.css";
import { Navigation } from "@/components/navigation";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "Radom Cup - Статистика турниров",
  description: "Следите за результатами турниров, статистикой игроков и достижениями в Radom Cup",
    generator: 'v0.app'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <Navigation />
        {children}
      </body>
    </html>
  );
}
