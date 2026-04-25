'use client';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ChainBotWrapper } from "@/components/chatbot/ChainBotWrapper";
import { usePathname } from "next/navigation";

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/forecasting': 'AI Demand Forecasting',
  '/sensors': 'IoT Sensor Dashboard',
  '/cold-chain': 'Cold Chain Live Tracking',
  '/waste': 'Waste Analytics',
  '/surplus': 'Surplus Redistribution',
  '/compliance': 'Policy & Compliance',
  '/settings': 'Settings',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? 'FoodChain CRM';

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <div className="flex-1 ml-[72px] flex flex-col">
        <Header title={title} />
        <main className="flex-1 pt-16 p-6 overflow-auto">
          {children}
        </main>
      </div>
      <ChainBotWrapper />
    </div>
  );
}
