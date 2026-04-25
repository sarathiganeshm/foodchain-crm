# FoodChain CRM

A production-grade supply chain food waste reduction platform for UK retail. Built with Next.js 16, Framer Motion, Spline 3D, and Recharts.

## Features

- **Live Dashboard** — Real-time KPIs, 3D scroll animations, supply chain flow visualisation
- **AI Demand Forecasting** — MAPE tracking, Bullwhip Effect analyser, order recommendations
- **IoT Sensor Dashboard** — 20 live sensors across UK locations with sparklines and alert log
- **Cold Chain Live Tracking** — Shipment tracking, integrity scoring, animated SVG flow diagram
- **Waste Analytics** — 12-month trends, Courtauld 2030 target progress, product breakdown
- **Surplus Redistribution** — Surplus stock actioning (donate/markdown/redirect), partner management
- **Policy & Compliance** — EPR reform, Courtauld Commitment, cosmetic rejection analysis
- **Settings** — Supplier management, alert thresholds, notification toggles
- **ChainBot** — AI assistant powered by Claude, with live system context and proactive alerts

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui |
| Animation | Framer Motion |
| 3D Scenes | Spline / @splinetool/react-spline |
| Charts | Recharts |
| AI | Anthropic Claude API |
| Icons | Lucide React |

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd foodchain-crm
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Get your key at [console.anthropic.com](https://console.anthropic.com).

> **Note:** ChainBot degrades gracefully without an API key — all other features work fully.

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the login page.

**Demo credentials:** any email/password (demo mode, no auth required).

## Project Structure

```
foodchain-crm/
├── app/
│   ├── (dashboard)/          # Route group with Sidebar + Header + ChainBot
│   │   ├── dashboard/        # Main dashboard with 3D scroll hero
│   │   ├── forecasting/      # AI demand forecasting + Bullwhip analyser
│   │   ├── sensors/          # IoT sensor grid + alert log
│   │   ├── cold-chain/       # Live shipment tracking + integrity score
│   │   ├── waste/            # Waste analytics + 2030 target progress
│   │   ├── surplus/          # Surplus stock redistribution
│   │   ├── compliance/       # Policy & regulatory compliance
│   │   └── settings/         # Supplier management + thresholds
│   ├── api/chat/             # ChainBot API route (server-side Anthropic call)
│   ├── login/                # Landing/login page with 3D Spline scene
│   └── not-found.tsx         # 404 page with Spline background
├── components/
│   ├── chatbot/              # ChainBot AI assistant (floating, fixed-position)
│   ├── layout/               # Sidebar + Header
│   ├── providers/            # DataProvider (live 3s simulation engine)
│   └── ui/                   # Spotlight, ContainerScroll, SplineScene, Toast
└── lib/
    ├── animations.ts         # Shared Framer Motion variants
    └── utils.ts              # cn() utility
```

## Data Simulation

All data is simulated client-side via `DataProvider`. No backend required beyond the ChainBot API route. 20 sensors update every 3 seconds with a 5% breach probability. Cold chain score and Bullwhip risk are derived live from sensor state.

## Deployment

Deploy to Vercel:

```bash
vercel
```

Set `ANTHROPIC_API_KEY` in your Vercel environment variables dashboard.

## UK Food Waste Context

This platform targets the **10.2M tonnes** of food wasted annually in the UK (WRAP, 2025), with a retail contribution of **270,000 tonnes** (£19B economic cost). The 2030 Courtauld Commitment requires a **50% reduction** from 2007 baseline.
