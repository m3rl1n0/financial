import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Cadenza — Spese ricorrenti",
  description: "Gestione spese ricorrenti",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full`}>
      <body className="min-h-full" style={{ fontFamily: "var(--font-ibm-plex-sans), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
