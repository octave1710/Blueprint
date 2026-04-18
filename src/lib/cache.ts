import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { Report } from "@/lib/types";

const CACHE_MAP: Record<string, string> = {
  "ramp.com": "_reference/RAMP_REFERENCE.json",
  "linear.app": "_reference/LINEAR_REFERENCE.json",
};

function normalize(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .split("/")[0];
}

export function getCachedReport(url: string): Report | null {
  const key = normalize(url);
  const relPath = CACHE_MAP[key];
  if (!relPath) return null;

  try {
    const absPath = resolve(process.cwd(), relPath);
    const raw = readFileSync(absPath, "utf8");
    return JSON.parse(raw) as Report;
  } catch {
    return null;
  }
}
