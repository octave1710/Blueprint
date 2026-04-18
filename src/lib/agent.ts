import Anthropic from "@anthropic-ai/sdk";
import type {
  MessageParam,
  Tool,
  ToolResultBlockParam,
  ToolUseBlock,
} from "@anthropic-ai/sdk/resources/messages";

import { SYSTEM_PROMPT } from "@/lib/prompts/system-prompt";
import { fetchUrl } from "@/lib/tools/fetch-url";
import { searchWeb } from "@/lib/tools/search-web";
import { detectStack } from "@/lib/tools/detect-stack";
import { getBenchmark } from "@/lib/tools/get-benchmark";
import { generateVerisConfig } from "@/lib/tools/generate-veris-config";
import type { AgentEvent, Report } from "@/lib/types";

export type { AgentEvent };

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 16000;
const MAX_ITERATIONS = 10;

const TOOLS: Tool[] = [
  {
    name: "fetch_url",
    description: "Fetch and parse the HTML of a page. Returns title, body text, and raw HTML.",
    input_schema: {
      type: "object",
      properties: { url: { type: "string", description: "The URL to fetch" } },
      required: ["url"],
    },
  },
  {
    name: "search_web",
    description: "Search the web via You.com Research for news, press releases, reviews, or analysis.",
    input_schema: {
      type: "object",
      properties: { query: { type: "string", description: "Natural-language search query" } },
      required: ["query"],
    },
  },
  {
    name: "detect_tech_stack",
    description: "Detect analytics, CRM, payment, support, and other tools embedded in a page's HTML.",
    input_schema: {
      type: "object",
      properties: { html: { type: "string", description: "Raw HTML to scan" } },
      required: ["html"],
    },
  },
  {
    name: "get_industry_benchmark",
    description: "Get the average AI maturity score and top use cases for a given industry.",
    input_schema: {
      type: "object",
      properties: {
        industry: {
          type: "string",
          description: "fintech / saas / ecommerce / healthcare / logistics / legal / media / manufacturing / other",
        },
      },
      required: ["industry"],
    },
  },
  {
    name: "generate_veris_config",
    description:
      "Generate a ready-to-use Veris sandbox configuration (veris.yaml + test scenarios) for a given blueprint. The enterprise buyer can run this config with `veris env push && veris run` to test the proposed agent before building it. Call this tool once per blueprint AFTER you have drafted all 3 blueprints, so 3 times total.",
    input_schema: {
      type: "object",
      properties: {
        blueprint_title: { type: "string", description: "Title of the blueprint" },
        blueprint_solution: { type: "string", description: "Full solution description: inputs, process, outputs" },
        blueprint_stack: {
          type: "array",
          items: { type: "string" },
          description: "Tools/services the agent will interact with",
        },
      },
      required: ["blueprint_title", "blueprint_solution", "blueprint_stack"],
    },
  },
];

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function summarize(tool: string, input: Record<string, unknown>, result: unknown): string {
  switch (tool) {
    case "fetch_url": {
      const r = result as { url: string; textContent: string };
      return `Fetched ${hostnameOf(r.url)} (${r.textContent.length} chars)`;
    }
    case "search_web": {
      const r = result as { query: string; sources: string[] };
      return `Searched: '${r.query}' (${r.sources.length} sources)`;
    }
    case "detect_tech_stack": {
      const r = result as Record<string, string[]>;
      const all = Object.values(r).flat();
      const preview = all.slice(0, 3).join(", ");
      return `Detected ${all.length} tools${preview ? `: ${preview}${all.length > 3 ? "..." : ""}` : ""}`;
    }
    case "get_industry_benchmark": {
      const r = result as { industry: string; avg_maturity: number } | null;
      if (!r) return `No benchmark for '${String(input.industry)}'`;
      return `Loaded ${r.industry} benchmark (avg maturity ${r.avg_maturity})`;
    }
    case "generate_veris_config": {
      const r = result as { summary: string };
      return r.summary;
    }
    default:
      return `${tool} completed`;
  }
}

async function runTool(name: string, input: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case "fetch_url":
      return fetchUrl(String(input.url));
    case "search_web":
      return searchWeb(String(input.query));
    case "detect_tech_stack":
      return detectStack(String(input.html));
    case "get_industry_benchmark":
      return getBenchmark(String(input.industry));
    case "generate_veris_config":
      return generateVerisConfig({
        blueprint_title: String(input.blueprint_title),
        blueprint_solution: String(input.blueprint_solution),
        blueprint_stack: Array.isArray(input.blueprint_stack)
          ? input.blueprint_stack.map(String)
          : [],
      });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function extractFinalText(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

function tryParseReport(text: string): Report | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed as Report;
  } catch {
    // fall through to substring extraction
  }

  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      const parsed: unknown = JSON.parse(text.slice(first, last + 1));
      if (parsed && typeof parsed === "object") return parsed as Report;
    } catch {
      // give up
    }
  }

  return null;
}

export async function* runAudit(url: string): AsyncGenerator<AgentEvent> {
  yield { type: "text", content: `Starting audit for ${url}...` };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    yield { type: "error", message: "ANTHROPIC_API_KEY is not set" };
    return;
  }

  const client = new Anthropic({ apiKey });
  const messages: MessageParam[] = [
    { role: "user", content: `Audit this company: ${url}` },
  ];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    let response: Anthropic.Messages.Message;
    try {
      response = await client.messages.create({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: TOOLS,
        messages,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      yield { type: "error", message: `Anthropic API error: ${message}` };
      return;
    }

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason === "tool_use") {
      const toolUses = response.content.filter(
        (b): b is ToolUseBlock => b.type === "tool_use",
      );
      const toolResults: ToolResultBlockParam[] = [];

      for (const block of toolUses) {
        const input = (block.input ?? {}) as Record<string, unknown>;
        yield { type: "tool_call", tool: block.name, input, id: block.id };

        let result: unknown;
        try {
          result = await runTool(block.name, input);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`Tool ${block.name} failed:`, message);
          result = { error: message };
        }

        yield {
          type: "tool_result",
          tool: block.name,
          id: block.id,
          result,
          summary: summarize(block.name, input, result),
        };

        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      messages.push({ role: "user", content: toolResults });
      continue;
    }

    if (response.stop_reason === "max_tokens") {
      yield { type: "error", message: "Response truncated — increase max_tokens" };
      return;
    }

    if (response.stop_reason === "end_turn") {
      const text = extractFinalText(response.content);
      const report = tryParseReport(text);
      if (report) {
        yield { type: "final_report", report };
      } else {
        yield { type: "error", message: `Agent returned non-JSON output: ${text.slice(0, 500)}` };
      }
      return;
    }

    yield { type: "error", message: `Unexpected stop_reason: ${response.stop_reason}` };
    return;
  }

  yield { type: "error", message: `Reached max iterations (${MAX_ITERATIONS}) without final report` };
}
