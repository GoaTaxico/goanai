import type { UIMessage } from "ai";

export type SourceLink = {
  title: string;
  url: string;
};

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function add(links: SourceLink[], url: unknown, title: unknown, source: unknown) {
  if (typeof url !== "string" || !url.startsWith("https://")) return;
  if (url.toLowerCase().includes("xkiro")) return;
  const host = hostname(url);
  if (!host) return;
  const label =
    typeof title === "string" && title.trim()
      ? title.trim()
      : typeof source === "string" && source.trim()
        ? source.trim()
        : host;
  if (links.some((item) => item.url === url)) return;
  links.push({ title: label.slice(0, 48), url });
}

function collect(value: unknown, links: SourceLink[]) {
  if (!value || typeof value !== "object") return;
  const row = value as { ok?: unknown; results?: unknown; url?: unknown; title?: unknown; source?: unknown };
  if (row.ok === true && Array.isArray(row.results)) {
    for (const item of row.results) collect(item, links);
    return;
  }
  add(links, row.url, row.title, row.source);
}

export function sourceLinks(message: UIMessage) {
  const links: SourceLink[] = [];
  for (const part of message.parts) {
    if (!part.type.startsWith("tool-") || !("output" in part)) continue;
    collect(part.output, links);
    if (links.length >= 4) break;
  }
  return links.slice(0, 4);
}
