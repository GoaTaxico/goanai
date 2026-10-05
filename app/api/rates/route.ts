import { applyPegs } from "@/lib/exchange";

export const runtime = "nodejs";

const RATES_URL = "https://api.frankfurter.dev/v1/latest?from=EUR";
const MAX_AGE = 12 * 60 * 60 * 1000;

type Cached = { at: number; body: { date: string; rates: Record<string, number> } };

function cache() {
  return globalThis as typeof globalThis & { __susegadFx?: Cached };
}

export async function GET() {
  const stored = cache().__susegadFx;
  if (stored && Date.now() - stored.at < MAX_AGE) {
    return Response.json(stored.body, { headers: { "cache-control": "public, max-age=3600" } });
  }
  try {
    const response = await fetch(RATES_URL, { cache: "no-store", signal: AbortSignal.timeout(8_000) });
    if (!response.ok) throw new Error("rates");
    const data = (await response.json()) as { date?: string; rates?: Record<string, number> };
    if (!data.date || !data.rates?.INR || !data.rates.USD) throw new Error("rates");
    const body = { date: data.date, rates: applyPegs(data.rates) };
    cache().__susegadFx = { at: Date.now(), body };
    return Response.json(body, { headers: { "cache-control": "public, max-age=3600" } });
  } catch {
    if (stored) return Response.json(stored.body, { headers: { "cache-control": "public, max-age=300" } });
    return Response.json({ error: "rates" }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
