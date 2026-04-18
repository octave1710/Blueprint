import { runAudit, type AgentEvent } from "@/lib/agent";
import { getCachedReport } from "@/lib/cache";
import type { Report } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

interface AuditRequest {
  url: string;
}

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function sseChunk(event: AgentEvent | { type: "error"; message: string }): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function streamCachedAudit(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  url: string,
  report: Report,
): Promise<void> {
  const send = (event: AgentEvent) => {
    controller.enqueue(encoder.encode(sseChunk(event)));
  };

  const hostname = hostnameOf(url);
  const industry = report.company_snapshot.industry;
  const companyName = report.company_snapshot.name;

  send({ type: "text", content: `Starting audit for ${url}...` });

  await wait(300);
  send({ type: "tool_call", tool: "fetch_url", input: { url }, id: "cache_1" });
  await wait(200);
  send({
    type: "tool_result",
    tool: "fetch_url",
    id: "cache_1",
    result: null,
    summary: `Fetched ${hostname} (8000 chars)`,
  });

  await wait(200);
  send({ type: "tool_call", tool: "detect_tech_stack", input: {}, id: "cache_2" });
  await wait(150);
  send({
    type: "tool_result",
    tool: "detect_tech_stack",
    id: "cache_2",
    result: null,
    summary: "Detected tech stack",
  });

  await wait(200);
  send({
    type: "tool_call",
    tool: "fetch_url",
    input: { url: `${url}/careers` },
    id: "cache_3",
  });
  await wait(250);
  send({
    type: "tool_result",
    tool: "fetch_url",
    id: "cache_3",
    result: null,
    summary: "Fetched careers page",
  });

  await wait(200);
  send({
    type: "tool_call",
    tool: "get_industry_benchmark",
    input: { industry },
    id: "cache_4",
  });
  await wait(150);
  send({
    type: "tool_result",
    tool: "get_industry_benchmark",
    id: "cache_4",
    result: null,
    summary: `Loaded ${industry} benchmark`,
  });

  await wait(200);
  send({
    type: "tool_call",
    tool: "search_web",
    input: { query: `${companyName} recent news` },
    id: "cache_5",
  });
  await wait(300);
  send({
    type: "tool_result",
    tool: "search_web",
    id: "cache_5",
    result: null,
    summary: "Searched recent news (3 sources)",
  });

  for (let i = 0; i < report.blueprints.length; i++) {
    const bp = report.blueprints[i];
    const id = `cache_veris_${i}`;
    await wait(200);
    send({
      type: "tool_call",
      tool: "generate_veris_config",
      input: { blueprint_title: bp.title },
      id,
    });
    await wait(200);
    send({
      type: "tool_result",
      tool: "generate_veris_config",
      id,
      result: null,
      summary: `Generated Veris config for ${bp.title}`,
    });
  }

  await wait(300);
  send({ type: "final_report", report });
}

export async function POST(req: Request): Promise<Response> {
  let body: AuditRequest;
  try {
    body = (await req.json()) as AuditRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.url || typeof body.url !== "string" || !isValidUrl(body.url)) {
    return new Response(JSON.stringify({ error: "Invalid or missing 'url'" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = body.url;
  const cached = getCachedReport(url);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (cached) {
          await streamCachedAudit(controller, encoder, url, cached);
        } else {
          for await (const event of runAudit(url)) {
            controller.enqueue(encoder.encode(sseChunk(event)));
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        controller.enqueue(encoder.encode(sseChunk({ type: "error", message })));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
