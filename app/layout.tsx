import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/components/providers/DataProvider";
import { ToastProvider } from "@/components/ui/toast-provider";

export const metadata: Metadata = {
  title: "FoodChain CRM — UK Supply Chain Intelligence",
  description: "Production-grade supply chain food waste reduction platform for UK retail",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-[#030712]">
        <DataProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </DataProvider>
      </body>
    </html>
  );
}
