"use client";

import { useMemo } from "react";
import type { AgentEvent } from "@/lib/types";
import { CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";

interface ReasoningStreamProps {
  events: AgentEvent[];
}

interface ToolCard {
  kind: "tool";
  key: string;
  tool: string;
  input: Record<string, unknown>;
  resultSummary: string | null;
}

interface TextCard {
  kind: "text";
  key: string;
  content: string;
}

interface FinalCard {
  kind: "final";
  key: string;
}

interface ErrorCard {
  kind: "error";
  key: string;
  message: string;
}

type Card = ToolCard | TextCard | FinalCard | ErrorCard;

const TOOL_COLORS: Record<string, string> = {
  fetch_url: "text-sky-400 border-sky-500/30 bg-sky-500/5",
  search_web: "text-amber-400 border-amber-500/30 bg-amber-500/5",
  detect_tech_stack: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
  get_industry_benchmark: "text-rose-400 border-rose-500/30 bg-rose-500/5",
  generate_veris_config: "text-violet-400 border-violet-500/30 bg-violet-500/5",
};

function buildCards(events: AgentEvent[]): Card[] {
  const cards: Card[] = [];
  const toolCardIndex = new Map<string, number>();

  events.forEach((event, i) => {
    switch (event.type) {
      case "tool_call": {
        const card: ToolCard = {
          kind: "tool",
          key: `t-${event.id}`,
          tool: event.tool,
          input: event.input,
          resultSummary: null,
        };
        toolCardIndex.set(event.id, cards.length);
        cards.push(card);
        break;
      }
      case "tool_result": {
        const idx = toolCardIndex.get(event.id);
        if (idx !== undefined) {
          const existing = cards[idx];
          if (existing.kind === "tool") {
            existing.resultSummary = event.summary;
          }
        }
        break;
      }
      case "text":
        cards.push({ kind: "text", key: `txt-${i}`, content: event.content });
        break;
      case "final_report":
        cards.push({ kind: "final", key: `final-${i}` });
        break;
      case "error":
        cards.push({ kind: "error", key: `err-${i}`, message: event.message });
        break;
    }
  });

  return cards;
}

const HIDE_INPUT_FOR = new Set(["detect_tech_stack", "fetch_url"]);

function inputPreview(tool: string, input: Record<string, unknown>): string | null {
  if (HIDE_INPUT_FOR.has(tool)) return null;
  const first = Object.entries(input)[0];
  if (!first) return null;
  const [k, v] = first;
  const str = typeof v === "string" ? v : JSON.stringify(v);
  const value = str.length > 60 ? `${str.slice(0, 60)}…` : str;
  return `${k}: ${value}`;
}

function pendingHint(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case "fetch_url": {
      const url = String(input.url ?? "");
      try {
        return `Fetching ${new URL(url).hostname}…`;
      } catch {
        return "Fetching page…";
      }
    }
    case "detect_tech_stack":
      return "Scanning HTML for embedded tools…";
    case "search_web":
      return "Searching the web…";
    case "get_industry_benchmark":
      return `Loading ${String(input.industry ?? "")} benchmark…`;
    case "generate_veris_config":
      return `Generating Veris config for ${String(input.blueprint_title ?? "blueprint")}…`;
    default:
      return "Working…";
  }
}

export function ReasoningStream({ events }: ReasoningStreamProps) {
  const cards = useMemo(() => buildCards(events), [events]);
  const reversed = useMemo(() => cards.slice().reverse(), [cards]);

  if (reversed.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-800 px-4 py-10 text-center">
        <div className="mx-auto mb-3 flex size-9 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800">
          <Sparkles className="size-4 text-zinc-500" strokeWidth={1.75} />
        </div>
        <p className="text-xs text-zinc-500">Tool calls will stream here as the agent works.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {reversed.map((card, i) => (
        <div
          key={card.key}
          style={{ animationDelay: `${Math.min(i, 4) * 50}ms` }}
          className="animate-in fade-in slide-in-from-top-2 duration-300 fill-mode-backwards"
        >
          <CardRender card={card} />
        </div>
      ))}
    </div>
  );
}

function CardRender({ card }: { card: Card }) {
  if (card.kind === "tool") {
    const isPending = card.resultSummary === null;
    const colors = TOOL_COLORS[card.tool] ?? "text-zinc-300 border-zinc-700/50 bg-zinc-900/40";
    return (
      <div
        className={`group rounded-lg border bg-zinc-950/40 p-3 transition ${isPending ? "border-zinc-700/60" : "border-zinc-800/60"}`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[11px] ${colors}`}>
            <span className={`size-1.5 rounded-full ${isPending ? "bg-current animate-pulse" : "bg-current opacity-60"}`} />
            {card.tool}
          </div>
          {isPending ? (
            <Loader2 className="size-3.5 text-zinc-500 animate-spin" strokeWidth={2} />
          ) : (
            <CheckCircle2 className="size-3.5 text-emerald-500/80" strokeWidth={2} />
          )}
        </div>
        {(() => {
          const preview = inputPreview(card.tool, card.input);
          if (preview) {
            return (
              <p className="mt-2 font-mono text-[11px] text-zinc-500 truncate">{preview}</p>
            );
          }
          if (isPending) {
            return (
              <p className="mt-2 text-[11px] text-zinc-500 italic">{pendingHint(card.tool, card.input)}</p>
            );
          }
          return null;
        })()}
        {card.resultSummary && (
          <p className="mt-1.5 text-xs text-zinc-300 leading-relaxed">{card.resultSummary}</p>
        )}
      </div>
    );
  }

  if (card.kind === "text") {
    return (
      <div className="rounded-lg border border-zinc-800/60 bg-zinc-900/30 px-3 py-2">
        <p className="text-xs text-zinc-400 leading-relaxed">{card.content}</p>
      </div>
    );
  }

  if (card.kind === "final") {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2.5 flex items-center gap-2">
        <CheckCircle2 className="size-4 text-emerald-400" strokeWidth={2} />
        <p className="text-xs text-emerald-300">Report ready.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 flex items-start gap-2">
      <AlertCircle className="size-4 text-rose-400 mt-0.5 shrink-0" strokeWidth={2} />
      <p className="text-xs text-rose-300 leading-relaxed break-words">{card.message}</p>
    </div>
  );
}
