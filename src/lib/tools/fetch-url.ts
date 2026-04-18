import * as cheerio from "cheerio";

export interface FetchUrlResult {
  url: string;
  title: string;
  textContent: string;
  html: string;
}

const MAX_TEXT = 8000;
const MAX_HTML = 50000;

export async function fetchUrl(url: string): Promise<FetchUrlResult> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Blueprint-Agent/1.0" },
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        url,
        title: "",
        textContent: `Error: HTTP ${response.status} ${response.statusText}`,
        html: "",
      };
    }

    const resolvedUrl = response.url || url;
    const rawHtml = await response.text();
    const $ = cheerio.load(rawHtml);

    const title = $("title").first().text().trim();

    $("script, style, noscript").remove();
    const textContent = $("body").text().replace(/\s+/g, " ").trim();

    return {
      url: resolvedUrl,
      title,
      textContent: textContent.slice(0, MAX_TEXT),
      html: rawHtml.slice(0, MAX_HTML),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      url,
      title: "",
      textContent: `Error: ${message}`,
      html: "",
    };
  }
}
