import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts', 'lucide-react'],
  },
};

export default nextConfig;
