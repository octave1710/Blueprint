"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import type { MaturityDimensions } from "@/lib/types";

interface MaturityRadarProps {
  dimensions: MaturityDimensions;
  industryAverage: number;
}

const LABELS: Record<keyof MaturityDimensions, string> = {
  data_infrastructure: "Data infra",
  automation_current: "Automation",
  ai_talent_signal: "AI talent",
  operational_complexity: "Ops complexity",
  competitive_ai_pressure: "AI pressure",
};

export function MaturityRadar({ dimensions, industryAverage }: MaturityRadarProps) {
  const data = (Object.keys(LABELS) as (keyof MaturityDimensions)[]).map((key) => ({
    axis: LABELS[key],
    company: dimensions[key] ?? 0,
    industry: industryAverage,
  }));

  return (
    <div className="w-full">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke="#27272a" strokeDasharray="2 4" />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fill: "#a1a1aa", fontSize: 11, fontFamily: "var(--font-sans)" }}
            />
            <PolarRadiusAxis
              domain={[0, 10]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="industry"
              dataKey="industry"
              stroke="#71717a"
              strokeDasharray="3 3"
              strokeWidth={1.25}
              fill="none"
            />
            <Radar
              name="company"
              dataKey="company"
              stroke="#10b981"
              strokeWidth={1.5}
              fill="#10b981"
              fillOpacity={0.18}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center justify-center gap-5 text-[11px] text-zinc-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          This company
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-zinc-500" />
          Industry avg
        </span>
      </div>
    </div>
  );
}
