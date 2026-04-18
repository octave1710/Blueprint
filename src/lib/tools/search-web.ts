export interface SearchWebResult {
  query: string;
  content: string;
  sources: string[];
}

interface YouSearchHit {
  title?: string;
  url?: string;
  snippet?: string;
}

interface YouSearchResponse {
  hits?: YouSearchHit[];
}

const MAX_HITS = 3;
const MAX_CONTENT_CHARS = 2000;

export async function searchWeb(query: string): Promise<SearchWebResult> {
  try {
    const apiKey = process.env.YOU_API_KEY;
    if (!apiKey) {
      return { query, content: "Search failed: YOU_API_KEY not set", sources: [] };
    }

    const url = `https://api.you.com/v1/search?query=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { "X-API-Key": apiKey },
    });

    if (!response.ok) {
      const body = await response.text();
      return {
        query,
        content: `Search failed: HTTP ${response.status} ${body}`,
        sources: [],
      };
    }

    const data = (await response.json()) as YouSearchResponse;
    const hits = (data.hits ?? []).slice(0, MAX_HITS);

    const content = hits
      .map((h) => `${h.title ?? ""}\n${h.snippet ?? ""}`.trim())
      .filter(Boolean)
      .join("\n\n")
      .slice(0, MAX_CONTENT_CHARS);

    const sources = hits
      .map((h) => h.url)
      .filter((u): u is string => typeof u === "string" && u.length > 0);

    return { query, content, sources };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { query, content: `Search failed: ${message}`, sources: [] };
  }
}
