import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TNHS LIKHA-SIS | Tingub National High School",
  description: "School Information System compliant with DepEd Order No. 015, s. 2026",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans antialiased h-full`}>
      <body className="bg-paper text-ink min-h-full flex flex-col font-sans font-normal">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
