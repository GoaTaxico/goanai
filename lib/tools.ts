import "server-only";

import { jsonSchema } from "ai";

import { hindiNumber } from "@/lib/hindi-number";
import { blockFetch, blockSearch, canFetch, canSearch, noteFetch, noteSearch } from "@/lib/quotas";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function inRange(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

const numberSchema = {
  type: "number",
} as const;

export const indiaTools = {
  istNow: {
    description:
      "Current date and time in India (IST). Call this when the person asks for the time, date, or day in India.",
    inputSchema: jsonSchema<Record<string, never>>({
      type: "object",
      properties: {},
      additionalProperties: false,
    }),
    execute: async () => ({
      timezone: "Asia/Kolkata",
      ist: new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "short",
      }).format(new Date()),
    }),
  },
  emi: {
    description:
      "Calculate a monthly home or personal loan EMI in rupees. Call this instead of doing the arithmetic yourself.",
    inputSchema: jsonSchema<{
      principal: number;
      annualRatePercent: number;
      months: number;
    }>({
      type: "object",
      properties: {
        principal: { ...numberSchema, description: "Loan amount in rupees" },
        annualRatePercent: { ...numberSchema, description: "Yearly interest percent" },
        months: { type: "integer", description: "Number of monthly payments" },
      },
      required: ["principal", "annualRatePercent", "months"],
      additionalProperties: false,
    }),
    execute: async ({ principal, annualRatePercent, months }: {
      principal: number;
      annualRatePercent: number;
      months: number;
    }) => {
      if (!inRange(principal, 1, 100_000_000_000) || !inRange(annualRatePercent, 0, 40) || !inRange(months, 1, 600)) {
        return { ok: false as const, reason: "Use a realistic loan amount, rate, and tenure." };
      }
      const monthlyRate = annualRatePercent / 12 / 100;
      const emi =
        monthlyRate === 0
          ? principal / months
          : (principal * monthlyRate * (1 + monthlyRate) ** months) /
            ((1 + monthlyRate) ** months - 1);
      const total = emi * months;
      return {
        ok: true as const,
        monthlyEmi: rupees(emi),
        totalPayment: rupees(total),
        totalInterest: rupees(total - principal),
        months,
      };
    },
  },
  gst: {
    description: "Calculate GST on an amount in rupees. Call this instead of doing the arithmetic yourself.",
    inputSchema: jsonSchema<{ amount: number; ratePercent: number; inclusive: boolean }>({
      type: "object",
      properties: {
        amount: { ...numberSchema, description: "Amount in rupees" },
        ratePercent: { ...numberSchema, description: "GST percent, such as 5, 12, or 18" },
        inclusive: { type: "boolean", description: "True when the amount already includes GST" },
      },
      required: ["amount", "ratePercent", "inclusive"],
      additionalProperties: false,
    }),
    execute: async ({ amount, ratePercent, inclusive }: {
      amount: number;
      ratePercent: number;
      inclusive: boolean;
    }) => {
      if (!inRange(amount, 0, 100_000_000_000) || !inRange(ratePercent, 0, 40)) {
        return { ok: false as const, reason: "Use a realistic amount and GST rate." };
      }
      const rate = ratePercent / 100;
      const base = inclusive ? amount / (1 + rate) : amount;
      const tax = inclusive ? amount - base : amount * rate;
      return {
        ok: true as const,
        base: rupees(base),
        gst: rupees(tax),
        total: rupees(base + tax),
        ratePercent,
        inclusive: Boolean(inclusive),
      };
    },
  },
  splitBill: {
    description: "Split a restaurant or shared bill across people, with an optional tip percent.",
    inputSchema: jsonSchema<{ total: number; people: number; tipPercent?: number }>({
      type: "object",
      properties: {
        total: { ...numberSchema, description: "Bill total in rupees" },
        people: { type: "integer", description: "How many people share the bill" },
        tipPercent: { ...numberSchema, description: "Optional tip percent" },
      },
      required: ["total", "people"],
      additionalProperties: false,
    }),
    execute: async ({ total, people, tipPercent = 0 }: {
      total: number;
      people: number;
      tipPercent?: number;
    }) => {
      if (!inRange(total, 0, 100_000_000) || !inRange(people, 1, 100) || !inRange(tipPercent, 0, 30)) {
        return { ok: false as const, reason: "Use a realistic bill, group size, and tip." };
      }
      const withTip = total * (1 + tipPercent / 100);
      return {
        ok: true as const,
        each: rupees(withTip / people),
        totalWithTip: rupees(withTip),
        people,
        tipPercent,
      };
    },
  },
  webSearch: {
    description:
      "Search the live web for a fact that changes. Use one short keyword query. Cite the source URL in the answer. If the result says the daily limit is used up, do not search again.",
    inputSchema: jsonSchema<{ query: string }>({
      type: "object",
      properties: {
        query: { type: "string", description: "Short search keywords" },
      },
      required: ["query"],
      additionalProperties: false,
    }),
    execute: async ({ query }: { query: string }) => searchWeb(query),
  },
  readPage: {
    description:
      "Read one public https page the person pasted. Use this when they share a link and want that page explained. If the result says the daily limit is used up, do not try another page.",
    inputSchema: jsonSchema<{ url: string }>({
      type: "object",
      properties: {
        url: { type: "string", description: "One public https URL" },
      },
      required: ["url"],
      additionalProperties: false,
    }),
    execute: async ({ url }: { url: string }) => readPage(url),
  },
  percentage: {
    description:
      "Calculate a percentage. Use percent and amount for 'what is X percent of Y'. Use part and whole for 'what percent is A of B'.",
    inputSchema: jsonSchema<{ percent?: number; amount?: number; part?: number; whole?: number }>({
      type: "object",
      properties: {
        percent: { ...numberSchema, description: "Percent, such as 18" },
        amount: { ...numberSchema, description: "Amount the percent applies to" },
        part: { ...numberSchema, description: "The smaller number" },
        whole: { ...numberSchema, description: "The total" },
      },
      additionalProperties: false,
    }),
    execute: async (input: { percent?: number; amount?: number; part?: number; whole?: number }) => {
      if (inRange(input.percent ?? NaN, 0, 1000) && inRange(input.amount ?? NaN, 0, 100_000_000_000)) {
        const result = ((input.percent as number) / 100) * (input.amount as number);
        return { ok: true as const, result: Math.round(result * 100) / 100, percent: input.percent, amount: input.amount };
      }
      if (inRange(input.part ?? NaN, 0, 100_000_000_000) && inRange(input.whole ?? NaN, 0.01, 100_000_000_000)) {
        const result = ((input.part as number) / (input.whole as number)) * 100;
        return { ok: true as const, result: Math.round(result * 100) / 100, part: input.part, whole: input.whole };
      }
      return { ok: false as const, reason: "Give a percent and an amount, or a part and a whole." };
    },
  },
  age: {
    description: "Find the age in years and months from a date of birth. The date must be YYYY-MM-DD.",
    inputSchema: jsonSchema<{ date: string }>({
      type: "object",
      properties: {
        date: { type: "string", description: "Date of birth as YYYY-MM-DD" },
      },
      required: ["date"],
      additionalProperties: false,
    }),
    execute: async ({ date }: { date: string }) => ageFromDate(date),
  },
  distance: {
    description: "Convert between kilometres and miles.",
    inputSchema: jsonSchema<{ value: number; from: "km" | "miles" }>({
      type: "object",
      properties: {
        value: { ...numberSchema, description: "The distance" },
        from: { type: "string", enum: ["km", "miles"], description: "The unit being converted from" },
      },
      required: ["value", "from"],
      additionalProperties: false,
    }),
    execute: async ({ value, from }: { value: number; from: "km" | "miles" }) => {
      if (!inRange(value, 0, 1_000_000) || (from !== "km" && from !== "miles")) {
        return { ok: false as const, reason: "Give a distance in km or miles." };
      }
      const miles = from === "km" ? value * 0.621371 : value;
      const km = from === "miles" ? value * 1.609344 : value;
      return {
        ok: true as const,
        kilometres: Math.round(km * 100) / 100,
        miles: Math.round(miles * 100) / 100,
      };
    },
  },
  hindiWords: {
    description: "Write a whole number in Hindi words. Use this instead of spelling the number yourself.",
    inputSchema: jsonSchema<{ value: number }>({
      type: "object",
      properties: {
        value: { type: "integer", description: "A whole number from 0 to 99999999" },
      },
      required: ["value"],
      additionalProperties: false,
    }),
    execute: async ({ value }: { value: number }) => {
      const words = hindiNumber(value);
      if (!words) return { ok: false as const, reason: "Use a whole number from 0 to 99999999." };
      return { ok: true as const, value, words };
    },
  },
};

type SearchResult =
  | { ok: false; reason: "empty" | "limit" | "unavailable" }
  | {
      ok: true;
      results: Array<{ title: string; url: string; snippet: string; source: string }>;
    };

const searchCache = new Map<string, SearchResult>();

async function searchWeb(query: string): Promise<SearchResult> {
  const trimmed = query.trim().slice(0, 180);
  if (!trimmed) return { ok: false as const, reason: "empty" };

  const cached = searchCache.get(trimmed);
  if (cached) return cached;
  if (!canSearch()) return { ok: false as const, reason: "limit" };

  const key = process.env.XKIRO_API_KEY?.trim();
  if (!key) return { ok: false as const, reason: "unavailable" };

  try {
    const response = await fetch("https://api.xkiro.com/v1/search", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "xkiro/web-search",
        query: trimmed,
        max_results: 4,
        country: "IN",
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (response.status === 402 || response.status === 429) {
      blockSearch();
      return { ok: false as const, reason: "limit" };
    }
    if (!response.ok) return { ok: false as const, reason: "unavailable" };

    const data = (await response.json()) as {
      results?: Array<{ title?: string; url?: string; snippet?: string; source?: string }>;
      usage?: { remainingToday?: number };
    };
    if (typeof data.usage?.remainingToday === "number" && data.usage.remainingToday <= 1) {
      blockSearch();
    } else {
      noteSearch();
    }

    const payload = {
      ok: true as const,
      results: (data.results ?? []).slice(0, 4).map((item) => ({
        title: item.title ?? "",
        url: item.url ?? "",
        snippet: item.snippet ?? "",
        source: item.source ?? "",
      })),
    };
    searchCache.set(trimmed, payload);
    return payload;
  } catch {
    return { ok: false as const, reason: "unavailable" };
  }
}

type PageResult =
  | { ok: false; reason: "invalid" | "limit" | "unavailable" }
  | { ok: true; title: string; url: string; content: string };

const pageCache = new Map<string, PageResult>();

function publicPage(input: string) {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local") || host.endsWith(".internal")) return null;
    if (host.includes(":") || host.includes("xkiro")) return null;
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return null;
    return url.toString().slice(0, 2000);
  } catch {
    return null;
  }
}

function istParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

function ageFromDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false as const, reason: "Use a date like 2012-05-04." };
  }
  const [year, month, day] = date.split("-").map(Number);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
    return { ok: false as const, reason: "That date is not valid." };
  }
  const today = istParts();
  let years = today.year - year;
  let months = today.month - month;
  if (today.day < day) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0 || years > 130) return { ok: false as const, reason: "That date is not a realistic birthday." };
  return { ok: true as const, years, months, date };
}

async function readPage(input: string): Promise<PageResult> {
  const url = publicPage(input);
  if (!url) return { ok: false, reason: "invalid" };
  const cached = pageCache.get(url);
  if (cached) return cached;
  if (!canFetch()) return { ok: false, reason: "limit" };

  const key = process.env.XKIRO_API_KEY?.trim();
  if (!key) return { ok: false, reason: "unavailable" };

  try {
    const response = await fetch("https://api.xkiro.com/v1/fetch", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "xkiro/web-fetch",
        urls: [url],
        max_content_tokens: 2000,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status === 402 || response.status === 429) {
      blockFetch();
      return { ok: false, reason: "limit" };
    }
    if (!response.ok) return { ok: false, reason: "unavailable" };

    const data = (await response.json()) as {
      results?: Array<{ url?: string; title?: string | null; content?: string; error?: string | null }>;
      usage?: { remainingToday?: number };
    };
    const page = data.results?.[0];
    const content = page?.content?.trim() ?? "";
    if (!content || page?.error) return { ok: false, reason: "unavailable" };

    if (typeof data.usage?.remainingToday === "number" && data.usage.remainingToday <= 1) {
      blockFetch();
    } else {
      noteFetch();
    }

    const payload = {
      ok: true as const,
      title: page?.title?.trim() || url,
      url: page?.url || url,
      content: content.slice(0, 4000),
    };
    pageCache.set(url, payload);
    return payload;
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
