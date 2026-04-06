import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ChatCalcAI from "@/components/ChatCalcAI";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BusinessCalc - Advanced AI Business Intelligence Calculators",
  description: "Comprehensive collection of business, banking, finance, accounting, tax, and analytical calculators. Fast, accurate, and easy to use.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@100..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased 
          bg-[#F8FAFC] dark:bg-[#0B0F19]
          text-[#0F172A] dark:text-gray-100
          transition-colors duration-300`}
      >
        <ThemeProvider>
          <CurrencyProvider>
            <Header />
            {children}
            <ChatCalcAI />
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
