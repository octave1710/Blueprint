export interface CompanySnapshot {
  name: string;
  industry: string;
  size_estimate: string;
  stage: string;
  positioning: string;
}

export interface MaturityDimensions {
  data_infrastructure: number;
  automation_current: number;
  ai_talent_signal: number;
  operational_complexity: number;
  competitive_ai_pressure: number;
}

export interface MaturityScore {
  overall: number;
  dimensions: MaturityDimensions;
  industry_average: number;
  reasoning: string;
}

export interface BlueprintROI {
  hours_saved_per_month: number;
  dollar_value_per_month: number;
  reasoning: string;
}

export interface VerisConfig {
  yaml: string;
  scenarios: string;
}

export interface Blueprint {
  priority: number;
  title: string;
  problem: string;
  solution: string;
  stack: string[];
  estimated_roi: BlueprintROI;
  evidence_citations: string[];
  quick_win: boolean;
  timeline_weeks: number;
  veris_config?: VerisConfig;
}

export interface Report {
  company_snapshot: CompanySnapshot;
  ai_maturity_score: MaturityScore;
  blueprints: Blueprint[];
}

export type AgentEvent =
  | { type: "tool_call"; tool: string; input: Record<string, unknown>; id: string }
  | { type: "tool_result"; tool: string; id: string; result: unknown; summary: string }
  | { type: "text"; content: string }
  | { type: "final_report"; report: Report }
  | { type: "error"; message: string };
