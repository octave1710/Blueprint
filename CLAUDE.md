# Blueprint — Enterprise AI Audit Agent

## What this project is
Blueprint is an autonomous enterprise AI audit agent built for the Enterprise Agent Jam NYC hackathon (April 18, 2026).

User pastes a company URL → agent autonomously researches via tool use → returns 3 deployable AI agent blueprints with evidence-grounded ROI estimates.

The demo wow is **visible agentic behavior**: split-screen UI where the left shows the final report and the right streams every tool call as it happens.

## Architecture

- Frontend: Next.js 14 App Router + Tailwind + shadcn/ui
- Backend: Next.js API route at /api/audit that streams SSE to the frontend
- Agent: Claude Sonnet 4.6 via @anthropic-ai/sdk with native tool use
- Research: You.com Research API (endpoint: https://api.you.com/v1/research)
- Sandbox: Veris AI for live blueprint instantiation (API key provided at hackathon)

## File structure (target)

src/
├── app/
│   ├── api/audit/route.ts       # POST endpoint, orchestrates agent, SSE stream
│   └── page.tsx                 # Landing page with split-screen UI
├── lib/
│   ├── agent.ts                 # Claude agent loop (tool use)
│   ├── prompts/system-prompt.ts # SYSTEM_PROMPT constant
│   └── tools/
│       ├── fetch-url.ts         # Fetch + Cheerio HTML parse
│       ├── search-web.ts        # You.com /v1/research call
│       ├── detect-stack.ts      # Regex on HTML for GA, HubSpot, Stripe, etc.
│       └── get-benchmark.ts     # Reads src/data/industries.json
├── components/blueprint/
│   ├── url-input.tsx
│   ├── reasoning-stream.tsx     # Right panel, tool call cards
│   ├── report-card.tsx          # Left panel, final report
│   └── maturity-radar.tsx       # Recharts radar chart
└── data/industries.json         # Hardcoded industry benchmarks

## Environment variables

.env.local at root:
- ANTHROPIC_API_KEY
- YOU_API_KEY
- VERIS_API_KEY (added at hackathon)

## Important constraints

- Build window: 11:00–17:00 on April 18, 2026.
- MVP must work end-to-end on ONE URL (Ramp is the demo company).
- _reference/RAMP_REFERENCE.json contains a known-good agent output — use as fallback if agent fails.
- No auth, no database, no PDF export. Single-page app.
- Dark mode by default (projector-friendly).

## Coding conventions

- TypeScript strict. No `any`.
- Agent tool definitions follow Anthropic's tool_use schema exactly.
- All You.com and Anthropic calls happen server-side (API routes) — never client-side.
- Stream SSE using native ReadableStream, not third-party libs.
- The Anthropic model to use is claude-sonnet-4-6. Do NOT use any other model string.
