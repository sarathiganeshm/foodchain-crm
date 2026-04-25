'use client';
import dynamic from 'next/dynamic';

const ChainBot = dynamic(() => import('./ChainBot'), { ssr: false });

export function ChainBotWrapper() {
  return <ChainBot />;
}
