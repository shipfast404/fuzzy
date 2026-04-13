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
  title: "Matcher - Appariement marchés publics",
  description: "Outil d'appariement automatique entre fichiers marchés publics et catalogues distributeurs",
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
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-800">
        <AppProvider>
          <header className="bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto flex items-center gap-3 px-6 h-14">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="15" y1="3" x2="15" y2="21" />
              </svg>
              <span className="text-sm font-semibold tracking-tight text-slate-800">Matcher</span>
              <span className="text-xs text-slate-400 hidden sm:inline">Appariement marchés publics</span>
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
