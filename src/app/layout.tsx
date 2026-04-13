import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
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
  title: "FuzzyMatch - Matching marchés publics",
  description: "Outil de matching automatique entre fichiers marchés publics et catalogues distributeurs",
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
      <body className="min-h-full flex flex-col bg-gray-50">
        <AppProvider>
          <header className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-800">
                FuzzyMatch
              </h1>
              <span className="text-xs text-gray-400">Matching marchés publics</span>
            </div>
          </header>
          <main className="flex-1">
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
