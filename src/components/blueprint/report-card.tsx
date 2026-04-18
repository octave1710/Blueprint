"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Zap, Clock, ChevronDown } from "lucide-react";

import type { Blueprint, Report, VerisConfig } from "@/lib/types";
import { MaturityRadar } from "@/components/blueprint/maturity-radar";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ReportCardProps {
  report: Report;
}

const PRIORITY_COLORS: Record<number, string> = {
  1: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  2: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  3: "bg-zinc-800/60 text-zinc-300 border-zinc-700/60",
};

const PRIORITY_ACCENT: Record<number, string> = {
  1: "border-l-emerald-500/40",
  2: "border-l-sky-500/40",
  3: "border-l-zinc-500/40",
};

const VERIS_CLI_COMMANDS = `Save this as .veris/veris.yaml in your project root, then run:
veris env create --name my-agent
veris env push
veris scenarios create
veris run`;

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  return `$${value.toLocaleString()}`;
}

export function ReportCard({ report }: ReportCardProps) {
  const { company_snapshot, ai_maturity_score, blueprints } = report;
  const sortedBlueprints = [...blueprints].sort((a, b) => a.priority - b.priority);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <CompanyHeader snapshot={company_snapshot} />
      <MaturitySection maturity={ai_maturity_score} />
      <div className="flex items-center gap-3">
        <h2 className="text-xs uppercase tracking-[0.18em] text-zinc-500 font-medium">Recommended Agents</h2>
        <div className="flex-1 h-px bg-zinc-800/80" />
      </div>
      <div className="flex flex-col gap-4">
        {sortedBlueprints.map((bp) => (
          <BlueprintBlock key={bp.priority} blueprint={bp} />
        ))}
      </div>
    </div>
  );
}

function CompanyHeader({ snapshot }: { snapshot: Report["company_snapshot"] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Pill>{snapshot.industry}</Pill>
        <Pill tone="muted">{snapshot.stage}</Pill>
        <Pill tone="muted">{snapshot.size_estimate}</Pill>
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 leading-none">
        {snapshot.name}
      </h1>
      <p className="text-sm text-zinc-400 leading-relaxed">{snapshot.positioning}</p>
    </div>
  );
}

function MaturitySection({ maturity }: { maturity: Report["ai_maturity_score"] }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
        <div className="md:w-[30%] shrink-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">AI Maturity</p>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-6xl font-semibold tracking-tight text-emerald-400 font-mono tabular-nums">
              {maturity.overall.toFixed(1)}
            </span>
            <span className="text-sm text-zinc-500">/ 10</span>
          </div>
          <p className="mt-1.5 text-xs text-zinc-500">
            Industry avg{" "}
            <span className="font-mono text-zinc-400">{maturity.industry_average.toFixed(1)}</span>
          </p>
        </div>
        <div className="md:w-[70%] min-w-0">
          <MaturityRadar dimensions={maturity.dimensions} industryAverage={maturity.industry_average} />
        </div>
      </div>
      <p className="mt-6 text-sm text-zinc-400 leading-relaxed max-w-prose">{maturity.reasoning}</p>
    </div>
  );
}

function BlueprintBlock({ blueprint }: { blueprint: Blueprint }) {
  const priorityColor = PRIORITY_COLORS[blueprint.priority] ?? PRIORITY_COLORS[3];
  const accentBorder = PRIORITY_ACCENT[blueprint.priority] ?? PRIORITY_ACCENT[3];
  const veris = blueprint.veris_config;
  const showVeris =
    veris !== undefined &&
    typeof veris.yaml === "string" &&
    veris.yaml.length > 0 &&
    typeof veris.scenarios === "string" &&
    veris.scenarios.length > 0;

  return (
    <article
      className={`group rounded-xl border border-zinc-800/80 border-l-2 ${accentBorder} bg-zinc-900/30 p-6 md:p-7 hover:border-zinc-700/80 transition-colors`}
    >
      <header className="flex items-start justify-between gap-4">
        <span
          className={`inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-[11px] font-mono ${priorityColor}`}
        >
          #{blueprint.priority}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {blueprint.quick_win && (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400 font-medium">
              <Zap className="size-3" strokeWidth={2.25} />
              Quick win
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500 font-mono">
            <Clock className="size-3" strokeWidth={2} />
            {blueprint.timeline_weeks}w
          </span>
        </div>
      </header>

      <h3 className="mt-3 text-lg font-semibold text-zinc-50 tracking-tight leading-snug">
        {blueprint.title}
      </h3>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Section label="Problem">{blueprint.problem}</Section>
        <Section label="Solution">{blueprint.solution}</Section>
      </div>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {blueprint.stack.map((tool) => (
          <span
            key={tool}
            className="rounded bg-zinc-900 border border-zinc-800/80 px-2 py-0.5 text-[11px] font-mono text-zinc-300"
          >
            {tool}
          </span>
        ))}
      </div>

      <div className="mt-5 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <Metric label="hours saved / mo" value={blueprint.estimated_roi.hours_saved_per_month.toString()} />
          <Metric
            label="value / mo"
            value={formatCurrency(blueprint.estimated_roi.dollar_value_per_month)}
            highlight
          />
        </div>
        <p className="mt-2 text-[12px] text-zinc-500 leading-relaxed">{blueprint.estimated_roi.reasoning}</p>
      </div>

      {blueprint.evidence_citations.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">Evidence</p>
          <ul className="mt-2 space-y-1">
            {blueprint.evidence_citations.map((cite, i) => (
              <li key={i} className="text-[12px] italic text-zinc-500 leading-relaxed">
                — {cite}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showVeris && (
        <div className="mt-4 pt-4 border-t border-zinc-800">
          <VerisConfigSection verisConfig={veris} />
        </div>
      )}
    </article>
  );
}

function VerisConfigSection({ verisConfig }: { verisConfig: VerisConfig }) {
  const [open, setOpen] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(VERIS_CLI_COMMANDS);
      toast.success("Copied ✓", {
        description: "Paste in your terminal to test this agent in Veris.",
      });
    } catch {
      toast.error("Copy failed", {
        description: "Clipboard access was blocked by the browser.",
      });
    }
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="w-full flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15 transition-colors px-4 py-2.5 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-zinc-200">Ready to test in Veris sandbox</span>
          </span>
          <ChevronDown
            className={`size-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
        <div className="mt-3">
          <Tabs defaultValue="yaml">
            <TabsList variant="line" className="bg-transparent">
              <TabsTrigger value="yaml" className="font-mono text-xs">
                veris.yaml
              </TabsTrigger>
              <TabsTrigger value="scenarios" className="font-mono text-xs">
                test scenarios
              </TabsTrigger>
            </TabsList>
            <TabsContent value="yaml" className="mt-3">
              <CodeBlock content={verisConfig.yaml} />
            </TabsContent>
            <TabsContent value="scenarios" className="mt-3">
              <CodeBlock content={verisConfig.scenarios} />
            </TabsContent>
          </Tabs>
          <div className="mt-3 flex justify-end">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              className="border-emerald-500/40 bg-emerald-500/5 text-emerald-300 hover:bg-emerald-500/15 hover:text-emerald-200 hover:border-emerald-500/60"
            >
              Copy CLI commands
            </Button>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function CodeBlock({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <pre className="bg-zinc-950 border border-zinc-800 rounded-md p-4 max-h-96 overflow-y-auto font-mono text-xs leading-relaxed">
      <code className="block">
        {lines.map((line, i) => {
          const isComment = line.trimStart().startsWith("#");
          return (
            <span key={i} className={`block ${isComment ? "text-zinc-500" : "text-zinc-300"}`}>
              {line.length === 0 ? "\u00A0" : line}
            </span>
          );
        })}
      </code>
    </pre>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">{label}</p>
      <p className="mt-1.5 text-sm text-zinc-300 leading-relaxed">{children}</p>
    </div>
  );
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <span className={`font-mono tabular-nums text-2xl tracking-tight ${highlight ? "text-emerald-400" : "text-zinc-50"}`}>
        {value}
      </span>
      <span className="ml-1.5 text-[11px] text-zinc-500">{label}</span>
    </div>
  );
}

function Pill({ children, tone = "accent" }: { children: React.ReactNode; tone?: "accent" | "muted" }) {
  const styles =
    tone === "accent"
      ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
      : "border-zinc-800 bg-zinc-900/40 text-zinc-400";
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-mono ${styles}`}>
      {children}
    </span>
  );
}
