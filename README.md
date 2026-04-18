# Blueprint — Autonomous Enterprise AI Audit Agent

**Enterprise Agent Jam NYC — April 18, 2026**

Blueprint audits any enterprise from a single URL and generates 3 deployable AI agent blueprints with evidence-grounded ROI estimates. Each blueprint comes with ready-to-deploy Veris sandbox configurations — so enterprise buyers can test proposed agents before committing engineering resources.

## Live demo

**Live app**: https://blueprint-alpha-five.vercel.app

**Loom walkthrough**: https://www.loom.com/share/2b103507d63f4f7e858b577dfeaca8ef

## What it does

1. User pastes a company URL
2. Claude Sonnet 4 agent autonomously researches the company using 5 tools: fetch_url, search_web (You.com), detect_tech_stack, get_industry_benchmark, generate_veris_config
3. Agent produces a structured report: AI maturity score, 3 enterprise-grade AI agent recommendations with problems, solutions, stacks, ROI estimates, and evidence citations
4. For each blueprint, Blueprint generates a complete veris.yaml + test scenarios, ready to run with `veris run`

## Architecture

- **Frontend**: Next.js 14 App Router + Tailwind + shadcn/ui
- **Agent**: Claude Sonnet 4 via @anthropic-ai/sdk with native tool use
- **Research**: You.com Search API
- **Sandbox integration**: Veris AI — Blueprint generates Veris configs as a 5th agent tool

## Sponsor integrations

- **Anthropic** — Claude Sonnet 4 powers the agent orchestration with multi-step tool use
- **You.com** — real-time enterprise research via Search API
- **Veris AI** — every recommended blueprint ships with a complete veris.yaml + scenarios for immediate sandbox testing

## Run locally

```bash
git clone https://github.com/octave1710/Blueprint.git
cd Blueprint
npm install
cp .env.example .env.local  # then fill in ANTHROPIC_API_KEY, YOU_API_KEY
npm run dev
```

## Built by

Octave Alliot-Herbin — building AI agents at the intersection of enterprise ops and applied LLMs.
