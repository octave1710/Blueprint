"use client";

import { useState } from "react";
import { UrlInput } from "@/components/blueprint/url-input";
import { ReasoningStream } from "@/components/blueprint/reasoning-stream";
import { ReportCard } from "@/components/blueprint/report-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AgentEvent, Report } from "@/lib/types";

const QUICK_LAUNCH = ["ramp.com", "linear.app", "stripe.com"];

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(submittedUrl: string) {
    setEvents([]);
    setReport(null);
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: submittedUrl }),
      });

      if (!res.ok || !res.body) {
        const body = await res.text().catch(() => "");
        setError(`Request failed: ${res.status} ${body}`);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;

          try {
            const event = JSON.parse(json) as AgentEvent;
            setEvents((prev) => [...prev, event]);
            if (event.type === "final_report") setReport(event.report);
            if (event.type === "error") setError(event.message);
          } catch (err) {
            console.warn("Failed to parse SSE chunk:", json, err);
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }

  function handleQuickLaunch(domain: string) {
    setUrl(domain);
    handleSubmit(`https://${domain}`);
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <Header isLoading={isLoading} />
      <main className="flex-1 mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:px-10 pt-6 sm:pt-8 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
          <section className="lg:col-span-3 flex flex-col gap-8 min-w-0">
            <UrlInput
              value={url}
              onValueChange={setUrl}
              onSubmit={handleSubmit}
              isLoading={isLoading}
            />
            {report ? (
              <ReportCard report={report} />
            ) : isLoading ? (
              <ReportSkeleton />
            ) : error ? (
              <ErrorBlock message={error} />
            ) : (
              <EmptyState onQuickLaunch={handleQuickLaunch} disabled={isLoading} />
            )}
          </section>
          <aside className="lg:col-span-2 min-w-0">
            <div className="lg:sticky lg:top-20 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">
                  Reasoning
                </h2>
                {isLoading && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    live
                  </span>
                )}
              </div>
              <div className="max-h-96 lg:max-h-none overflow-y-auto lg:overflow-visible pr-1 lg:pr-0">
                <ReasoningStream events={events} />
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Header({ isLoading }: { isLoading: boolean }) {
  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 md:px-10 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="relative size-5 rounded bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center">
            <div className="size-1.5 rounded-sm bg-emerald-400 animate-[pulse_3s_ease-in-out_infinite]" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-50">Blueprint</span>
        </div>
        {isLoading ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono tracking-tight">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Auditing
          </span>
        ) : (
          <p className="hidden sm:block text-xs text-zinc-500 tracking-tight">
            Autonomous enterprise AI audits
          </p>
        )}
      </div>
    </header>
  );
}

function EmptyState({
  onQuickLaunch,
  disabled,
}: {
  onQuickLaunch: (domain: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 sm:p-12">
      <p className="text-lg sm:text-xl text-zinc-400 leading-relaxed max-w-prose">
        Paste any company URL to generate a complete enterprise AI agent audit in under 90 seconds.
      </p>
      <div className="mt-8 flex flex-col gap-2.5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500 font-medium">
          Try one
        </p>
        <div className="flex flex-wrap gap-2">
          {QUICK_LAUNCH.map((domain) => (
            <button
              key={domain}
              type="button"
              disabled={disabled}
              onClick={() => onQuickLaunch(domain)}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-mono text-xs text-zinc-300 hover:border-emerald-500/40 hover:bg-emerald-500/5 hover:text-emerald-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="size-1 rounded-full bg-emerald-500/60" />
              {domain}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorBlock({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/[0.04] p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-rose-400 font-medium">Audit failed</p>
      <p className="mt-2 text-sm text-rose-200/90 leading-relaxed break-words">{message}</p>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="flex flex-col gap-6 opacity-60 animate-pulse">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 bg-zinc-900" />
          <Skeleton className="h-5 w-20 bg-zinc-900" />
          <Skeleton className="h-5 w-14 bg-zinc-900" />
        </div>
        <Skeleton className="h-9 w-72 bg-zinc-900" />
        <Skeleton className="h-4 w-[80%] bg-zinc-900" />
      </div>
      <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6 md:p-8 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10">
          <div className="md:w-44 flex flex-col gap-2">
            <Skeleton className="h-3 w-24 bg-zinc-900" />
            <Skeleton className="h-12 w-20 bg-zinc-900" />
            <Skeleton className="h-3 w-28 bg-zinc-900" />
          </div>
          <Skeleton className="flex-1 h-[260px] bg-zinc-900" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-full bg-zinc-900" />
          <Skeleton className="h-3 w-[92%] bg-zinc-900" />
          <Skeleton className="h-3 w-[78%] bg-zinc-900" />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 bg-zinc-900" />
            <Skeleton className="h-5 w-16 bg-zinc-900" />
          </div>
          <Skeleton className="h-6 w-3/4 bg-zinc-900" />
          <Skeleton className="h-4 w-full bg-zinc-900" />
          <Skeleton className="h-4 w-[85%] bg-zinc-900" />
        </div>
      ))}
    </div>
  );
}
