import "server-only";

import { jsonSchema } from "ai";

import { blockSearch, canSearch, noteSearch } from "@/lib/quotas";

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
