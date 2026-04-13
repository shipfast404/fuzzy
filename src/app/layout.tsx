import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ResultsProvider } from "@/context/ResultsContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Katalog",
  description: "Identifiez les lignes d'un appel d'offres auxquelles vous pouvez répondre",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-white text-slate-800">
        <ResultsProvider>
          {children}
        </ResultsProvider>
      </body>
    </html>
  );
}
