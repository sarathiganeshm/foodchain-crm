import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages, context } = await req.json();

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are ChainBot, an expert AI assistant embedded in FoodChain CRM — a UK retail supply chain food waste reduction platform. You have deep knowledge of:

- Supply Chain Management Theory (Christopher, 2022)
- The Bullwhip Effect and demand distortion in UK retail (Lee et al., 2024)
- Cold Chain Integrity Theory and temperature logistics (Aung & Chang, 2022)
- UK food waste statistics: 10.2M tonnes annually (WRAP, 2025), £19 billion economic cost (Defra, 2024), 270,000 tonnes retail waste (WRAP, 2024)
- AI demand forecasting using LSTM, Monte Carlo simulation, MAPE/WAPE metrics (Douaioui et al., 2024)
- IoT monitoring, GPS cold chain tracking, Time-Temperature Indicators (Protopappas et al., 2025)
- UK policy: EPR reform, Courtauld Commitment 2030, 50% reduction target by 2030 (WRAP, 2024)
- Cosmetic rejection standards (20-40% of produce rejected), FIFO stock rotation, surplus redistribution

Current live system context:
${JSON.stringify(context, null, 2)}

Be concise, professional, and data-driven. When referencing statistics always cite the source. Offer actionable recommendations. Format responses with clear structure — use short paragraphs, not long walls of text. If asked about sensor readings or alerts, interpret the live data provided in context and give specific recommendations.`,
      messages,
    });

    const content = response.content[0];
    return NextResponse.json({
      content: content.type === 'text' ? content.text : '',
    });
  } catch (error) {
    console.error('ChainBot API error:', error);
    return NextResponse.json({ error: 'ChainBot temporarily unavailable' }, { status: 500 });
  }
}
