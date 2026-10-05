export const CURRENCIES = [
  ["INR", "Indian rupee"],
  ["USD", "US dollar"],
  ["EUR", "Euro"],
  ["GBP", "British pound"],
  ["AED", "UAE dirham"],
  ["SAR", "Saudi riyal"],
  ["NPR", "Nepali rupee"],
  ["SGD", "Singapore dollar"],
  ["AUD", "Australian dollar"],
  ["CAD", "Canadian dollar"],
  ["JPY", "Japanese yen"],
  ["CNY", "Chinese yuan"],
  ["HKD", "Hong Kong dollar"],
  ["THB", "Thai baht"],
  ["MYR", "Malaysian ringgit"],
  ["CHF", "Swiss franc"],
  ["NZD", "New Zealand dollar"],
  ["ZAR", "South African rand"],
  ["KRW", "South Korean won"],
] as const;

const ZERO_DECIMALS = new Set(["JPY", "KRW"]);
const RATE_KEY = "bharat-ai-rates";
const MAX_AGE = 12 * 60 * 60 * 1000;

export type RateTable = { date: string; rates: Record<string, number> };

export function applyPegs(rates: Record<string, number>) {
  const next: Record<string, number> = { ...rates, EUR: 1 };
  if (next.USD) {
    next.AED = next.USD * 3.6725;
    next.SAR = next.USD * 3.75;
  }
  if (next.INR) next.NPR = next.INR * 1.6;
  return next;
}

export function convertAmount(amountText: string, from: string, to: string, rates: Record<string, number>) {
  const amount = Number(amountText);
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!Number.isFinite(amount) || amount < 0 || amount > 1e12 || !fromRate || !toRate) return null;
  return { value: (amount / fromRate) * toRate, unit: toRate / fromRate };
}

export function formatMoney(amount: number, code: string) {
  const digits = ZERO_DECIMALS.has(code) ? 0 : 2;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: code,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount);
}

export function formatUnit(amount: number) {
  const digits = amount >= 100 ? 2 : amount >= 1 ? 4 : 6;
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: digits }).format(amount);
}

function readSaved(): (RateTable & { at: number }) | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(RATE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as RateTable & { at?: number };
    if (!saved.date || !saved.rates?.INR || typeof saved.at !== "number") return null;
    return { date: saved.date, rates: saved.rates, at: saved.at };
  } catch {
    return null;
  }
}

export async function loadRates(): Promise<RateTable | null> {
  const saved = readSaved();
  if (saved && Date.now() - saved.at < MAX_AGE) return saved;
  try {
    const response = await fetch("/api/rates");
    if (!response.ok) return saved;
    const data = (await response.json()) as RateTable;
    if (!data.date || !data.rates?.INR) return saved;
    localStorage.setItem(RATE_KEY, JSON.stringify({ at: Date.now(), date: data.date, rates: data.rates }));
    return data;
  } catch {
    return saved;
  }
}
