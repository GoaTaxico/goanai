import { rupeeWords } from "@/lib/rupees-words";

function rupees(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function inRange(value: number, min: number, max: number) {
  return Number.isFinite(value) && value >= min && value <= max;
}

function money(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : NaN;
}

export function chequeWords(amount: string) {
  const words = rupeeWords(money(amount));
  if (!words) return null;
  return { english: words.english, hindi: words.hindi };
}

export function simpleInterest(principal: string, rate: string, years: string) {
  const p = money(principal);
  const r = money(rate);
  const t = money(years);
  if (!inRange(p, 1, 100_000_000_000) || !inRange(r, 0, 100) || !inRange(t, 0, 100)) return null;
  const interest = (p * r * t) / 100;
  return { interest: rupees(interest), amount: rupees(p + interest) };
}

export function profitLoss(cost: string, selling: string) {
  const c = money(cost);
  const s = money(selling);
  if (!inRange(c, 0.01, 100_000_000_000) || !inRange(s, 0, 100_000_000_000)) return null;
  const difference = s - c;
  return {
    kind: difference >= 0 ? ("profit" as const) : ("loss" as const),
    amount: rupees(Math.abs(difference)),
    percent: round2((Math.abs(difference) / c) * 100),
  };
}

export function averageOf(raw: string) {
  const values = raw
    .split(/[^0-9.-]+/)
    .filter((part) => part !== "" && part !== "-" && part !== ".")
    .map((part) => Number(part))
    .filter((value) => Number.isFinite(value));
  if (values.length < 1 || values.length > 20 || values.some((value) => !inRange(value, -1_000_000_000, 1_000_000_000))) {
    return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return { count: values.length, total: round2(total), average: round2(total / values.length) };
}

export function gstAmount(amount: string, rate: string, inclusive: boolean) {
  const value = money(amount);
  const percent = money(rate);
  if (!inRange(value, 0, 100_000_000_000) || !inRange(percent, 0, 40)) return null;
  const ratio = percent / 100;
  const base = inclusive ? value / (1 + ratio) : value;
  const tax = inclusive ? value - base : value * ratio;
  return { base: rupees(base), gst: rupees(tax), total: rupees(base + tax) };
}

export function emiAmount(principal: string, rate: string, months: string) {
  const p = money(principal);
  const annual = money(rate);
  const n = money(months);
  if (!inRange(p, 1, 100_000_000_000) || !inRange(annual, 0, 40) || !inRange(n, 1, 600) || !Number.isInteger(n)) return null;
  const monthlyRate = annual / 12 / 100;
  const emi = monthlyRate === 0 ? p / n : (p * monthlyRate * (1 + monthlyRate) ** n) / ((1 + monthlyRate) ** n - 1);
  const total = emi * n;
  return { monthly: rupees(emi), total: rupees(total), interest: rupees(total - p) };
}

function gcd(a: number, b: number): number {
  let left = Math.abs(a);
  let right = Math.abs(b);
  while (right) {
    const next = left % right;
    left = right;
    right = next;
  }
  return left || 1;
}

export function hcfLcm(first: string, second: string) {
  const a = Number(first);
  const b = Number(second);
  if (!Number.isInteger(a) || !Number.isInteger(b) || !inRange(Math.abs(a), 1, 1_000_000_000) || !inRange(Math.abs(b), 1, 1_000_000_000)) {
    return null;
  }
  const hcf = gcd(a, b);
  return { hcf, lcm: Math.abs(a * b) / hcf };
}

function simplify(numerator: number, denominator: number) {
  if (denominator < 0) {
    numerator = -numerator;
    denominator = -denominator;
  }
  const shared = gcd(numerator, denominator);
  return { numerator: numerator / shared, denominator: denominator / shared };
}

function fractionText(numerator: number, denominator: number) {
  const simple = simplify(numerator, denominator);
  if (simple.denominator === 1) return String(simple.numerator);
  return `${simple.numerator}/${simple.denominator}`;
}

export function fractionWork(topA: string, bottomA: string, op: string, topB: string, bottomB: string) {
  const a = Number(topA);
  const b = Number(bottomA);
  const c = Number(topB);
  const d = Number(bottomB);
  if (![a, b, c, d].every((value) => Number.isInteger(value) && inRange(Math.abs(value), 0, 1_000_000))) return null;
  if (b === 0 || d === 0) return null;
  if (op === "/" && c === 0) return null;
  let numerator = 0;
  let denominator = 1;
  if (op === "+") {
    numerator = a * d + c * b;
    denominator = b * d;
  } else if (op === "-") {
    numerator = a * d - c * b;
    denominator = b * d;
  } else if (op === "*") {
    numerator = a * c;
    denominator = b * d;
  } else if (op === "/") {
    numerator = a * d;
    denominator = b * c;
  } else {
    return null;
  }
  if (denominator === 0) return null;
  return fractionText(numerator, denominator);
}

export function ratioWork(left: string, right: string, share: string) {
  const a = Number(left);
  const b = Number(right);
  if (!inRange(a, 0.01, 1_000_000_000) || !inRange(b, 0.01, 1_000_000_000)) return null;
  const shared = gcd(Math.round(a * 100), Math.round(b * 100));
  const simpleLeft = Math.round(a * 100) / shared;
  const simpleRight = Math.round(b * 100) / shared;
  const amount = share.trim() ? money(share) : NaN;
  if (share.trim() && !inRange(amount, 0, 100_000_000_000)) return null;
  return {
    left: simpleLeft,
    right: simpleRight,
    first: share.trim() ? rupees((amount * a) / (a + b)) : "",
    second: share.trim() ? rupees((amount * b) / (a + b)) : "",
  };
}

export function discountPrice(marked: string, percent: string) {
  const price = money(marked);
  const off = money(percent);
  if (!inRange(price, 0, 100_000_000_000) || !inRange(off, 0, 100)) return null;
  const cut = (price * off) / 100;
  return { off: rupees(cut), sale: rupees(price - cut) };
}

export function shapeMeasure(shape: string, a: string, b: string) {
  const first = money(a);
  const second = money(b);
  if (shape === "square") {
    if (!inRange(first, 0, 1_000_000)) return null;
    return { area: String(round2(first * first)), perimeter: String(round2(4 * first)) };
  }
  if (shape === "circle") {
    if (!inRange(first, 0, 1_000_000)) return null;
    return { area: String(round2(Math.PI * first * first)), perimeter: String(round2(2 * Math.PI * first)) };
  }
  if (shape === "triangle") {
    if (!inRange(first, 0, 1_000_000) || !inRange(second, 0, 1_000_000)) return null;
    return { area: String(round2(0.5 * first * second)), perimeter: "" };
  }
  if (!inRange(first, 0, 1_000_000) || !inRange(second, 0, 1_000_000)) return null;
  return { area: String(round2(first * second)), perimeter: String(round2(2 * (first + second))) };
}

export function motion(find: string, first: string, second: string) {
  const x = money(first);
  const y = money(second);
  if (!inRange(x, 0, 1_000_000_000) || !inRange(y, 0.0001, 1_000_000_000)) return null;
  if (find === "distance") return { value: String(round2(x * y)), unit: "km" };
  if (find === "time") return { value: String(round2(x / y)), unit: "h" };
  return { value: String(round2(x / y)), unit: "km/h" };
}

export function percentOf(percent: string, amount: string) {
  const rate = money(percent);
  const value = money(amount);
  if (!inRange(rate, 0, 1000) || !inRange(value, 0, 100_000_000_000)) return null;
  return round2((rate / 100) * value);
}

export function percentRatio(part: string, whole: string) {
  const smaller = money(part);
  const total = money(whole);
  if (!inRange(smaller, 0, 100_000_000_000) || !inRange(total, 0.01, 100_000_000_000)) return null;
  return round2((smaller / total) * 100);
}

function istToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}

export function ageFromBirthday(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split("-").map(Number);
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const today = istToday();
  let years = today.year - year;
  let months = today.month - month;
  if (today.day < day) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years < 0 || years > 130) return null;
  return { years, months };
}

export function splitBill(total: string, people: string, tip: string) {
  const bill = money(total);
  const count = Number(people);
  const extra = tip.trim() ? money(tip) : 0;
  if (!inRange(bill, 0, 100_000_000) || !Number.isInteger(count) || !inRange(count, 1, 100) || !inRange(extra, 0, 30)) return null;
  const withTip = bill * (1 + extra / 100);
  return { each: rupees(withTip / count), total: rupees(withTip) };
}

const UNIT_SCALE: Record<string, number> = { length: 100, mass: 1000, volume: 1000 };

export function convertUnit(kind: string, way: string, raw: string) {
  const value = money(raw);
  if (!inRange(value, kind === "temp" ? -200 : 0, 1_000_000_000)) return null;
  if (kind === "temp") {
    const next = way === "back" ? ((value - 32) * 5) / 9 : (value * 9) / 5 + 32;
    return round2(next);
  }
  const scale = UNIT_SCALE[kind];
  if (!scale) return null;
  return round2(way === "back" ? value * scale : value / scale);
}

export function factorsOf(raw: string) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 100_000) return null;
  const found: number[] = [];
  for (let i = 1; i * i <= n; i += 1) {
    if (n % i === 0) {
      found.push(i);
      if (i * i !== n) found.push(n / i);
    }
  }
  return found.sort((left, right) => left - right);
}

export function powersOf(raw: string) {
  const n = Number(raw);
  if (!Number.isInteger(n) || !inRange(Math.abs(n), 0, 10_000)) return null;
  return { square: n * n, cube: n * n * n };
}

const ROMAN: [number, string][] = [
  [1000, "M"],
  [900, "CM"],
  [500, "D"],
  [400, "CD"],
  [100, "C"],
  [90, "XC"],
  [50, "L"],
  [40, "XL"],
  [10, "X"],
  [9, "IX"],
  [5, "V"],
  [4, "IV"],
  [1, "I"],
];

export function romanNumber(raw: string) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 3999) return null;
  let left = n;
  let text = "";
  for (const [value, glyph] of ROMAN) {
    while (left >= value) {
      text += glyph;
      left -= value;
    }
  }
  return text;
}

export function timesTable(raw: string) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 20) return null;
  return Array.from({ length: 10 }, (_, index) => {
    const step = index + 1;
    return `${n} × ${step} = ${n * step}`;
  });
}
