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
