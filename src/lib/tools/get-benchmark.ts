import { promises as fs } from "node:fs";
import path from "node:path";

export interface IndustryBenchmark {
  industry: string;
  avg_maturity: number;
  top_use_cases: string[];
  common_tech_stack: string[];
  competitive_ai_pressure: number;
}

interface IndustryEntry {
  avg_maturity: number;
  top_use_cases: string[];
  common_tech_stack: string[];
  competitive_ai_pressure: number;
}

type IndustriesFile = Record<string, IndustryEntry>;

let cache: IndustriesFile | null = null;

async function loadIndustries(): Promise<IndustriesFile> {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "src", "data", "industries.json");
  const raw = await fs.readFile(filePath, "utf-8");
  cache = JSON.parse(raw) as IndustriesFile;
  return cache;
}

export async function getBenchmark(industry: string): Promise<IndustryBenchmark | null> {
  const industries = await loadIndustries();
  const key = industry.toLowerCase().trim();

  const entry = industries[key] ?? industries.other;
  if (!entry) return null;

  return {
    industry: industries[key] ? key : "other",
    avg_maturity: entry.avg_maturity,
    top_use_cases: entry.top_use_cases,
    common_tech_stack: entry.common_tech_stack,
    competitive_ai_pressure: entry.competitive_ai_pressure,
  };
}
