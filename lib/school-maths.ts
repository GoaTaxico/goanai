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

const BIG = Number.MAX_SAFE_INTEGER;

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
  return { english: words.english, hindi: words.hindi, konkani: words.konkani, marathi: words.marathi };
}

export function simpleInterest(principal: string, rate: string, years: string) {
  const p = money(principal);
  const r = money(rate);
  const t = money(years);
  if (!inRange(p, 1, BIG) || !inRange(r, 0, 100) || !inRange(t, 0, 100)) return null;
  const interest = (p * r * t) / 100;
  return { interest: rupees(interest), amount: rupees(p + interest) };
}

export function profitLoss(cost: string, selling: string) {
  const c = money(cost);
  const s = money(selling);
  if (!inRange(c, 0.01, BIG) || !inRange(s, 0, BIG)) return null;
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
  if (values.length < 1 || values.length > 100 || values.some((value) => !inRange(value, -BIG, BIG))) {
    return null;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  const sorted = [...values].sort((left, right) => left - right);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  const counts = new Map<number, number>();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  const most = Math.max(...counts.values());
  const mode = most === 1 ? [] : [...counts].filter(([, count]) => count === most).map(([value]) => value);
  return { count: values.length, total: round2(total), average: round2(total / values.length), median: round2(median), mode };
}

export function gstAmount(amount: string, rate: string, inclusive: boolean) {
  const value = money(amount);
  const percent = money(rate);
  if (!inRange(value, 0, BIG) || !inRange(percent, 0, 40)) return null;
  const ratio = percent / 100;
  const base = inclusive ? value / (1 + ratio) : value;
  const tax = inclusive ? value - base : value * ratio;
  return { base: rupees(base), gst: rupees(tax), total: rupees(base + tax) };
}

export function emiAmount(principal: string, rate: string, months: string) {
  const p = money(principal);
  const annual = money(rate);
  const n = money(months);
  if (!inRange(p, 1, BIG) || !inRange(annual, 0, 40) || !inRange(n, 1, 1200) || !Number.isInteger(n)) return null;
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
  if (!Number.isInteger(a) || !Number.isInteger(b) || !inRange(Math.abs(a), 1, BIG) || !inRange(Math.abs(b), 1, BIG)) {
    return null;
  }
  const hcf = gcd(a, b);
  const lcm = (Math.abs(a) / hcf) * Math.abs(b);
  if (!Number.isSafeInteger(lcm)) return null;
  return { hcf, lcm };
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
  if (![a, b, c, d].every((value) => Number.isInteger(value) && inRange(Math.abs(value), 0, 10_000_000))) return null;
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
  if (!inRange(a, 0.01, BIG) || !inRange(b, 0.01, BIG)) return null;
  const shared = gcd(Math.round(a * 100), Math.round(b * 100));
  const simpleLeft = Math.round(a * 100) / shared;
  const simpleRight = Math.round(b * 100) / shared;
  const amount = share.trim() ? money(share) : NaN;
  if (share.trim() && !inRange(amount, 0, BIG)) return null;
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
  if (!inRange(price, 0, BIG) || !inRange(off, 0, 100)) return null;
  const cut = (price * off) / 100;
  return { off: rupees(cut), sale: rupees(price - cut) };
}

export function shapeMeasure(shape: string, a: string, b: string) {
  const first = money(a);
  const second = money(b);
  if (shape === "square") {
    if (!inRange(first, 0, 10_000_000)) return null;
    return { area: String(round2(first * first)), perimeter: String(round2(4 * first)) };
  }
  if (shape === "circle") {
    if (!inRange(first, 0, 10_000_000)) return null;
    return { area: String(round2(Math.PI * first * first)), perimeter: String(round2(2 * Math.PI * first)) };
  }
  if (shape === "triangle") {
    if (!inRange(first, 0, 10_000_000) || !inRange(second, 0, 10_000_000)) return null;
    return { area: String(round2(0.5 * first * second)), perimeter: "" };
  }
  if (!inRange(first, 0, 10_000_000) || !inRange(second, 0, 10_000_000)) return null;
  return { area: String(round2(first * second)), perimeter: String(round2(2 * (first + second))) };
}

export function motion(find: string, first: string, second: string) {
  const x = money(first);
  const y = money(second);
  if (!inRange(x, 0, BIG) || !inRange(y, 0.0001, BIG)) return null;
  if (find === "distance") return { value: String(round2(x * y)), unit: "km" };
  if (find === "time") return { value: String(round2(x / y)), unit: "h" };
  return { value: String(round2(x / y)), unit: "km/h" };
}

export function percentOf(percent: string, amount: string) {
  const rate = money(percent);
  const value = money(amount);
  if (!inRange(rate, 0, 1000) || !inRange(value, 0, BIG)) return null;
  return round2((rate / 100) * value);
}

export function percentRatio(part: string, whole: string) {
  const smaller = money(part);
  const total = money(whole);
  if (!inRange(smaller, 0, BIG) || !inRange(total, 0.01, BIG)) return null;
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
  if (!inRange(bill, 0, BIG) || !Number.isInteger(count) || !inRange(count, 1, 10_000) || !inRange(extra, 0, 30)) return null;
  const withTip = bill * (1 + extra / 100);
  return { each: rupees(withTip / count), total: rupees(withTip) };
}

const UNIT_SCALE: Record<string, number> = { length: 100, mass: 1000, volume: 1000 };

export function convertUnit(kind: string, way: string, raw: string) {
  const value = money(raw);
  if (!inRange(value, kind === "temp" ? -1000 : 0, BIG)) return null;
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
  if (!Number.isInteger(n) || n < 1 || n > 1_000_000_000) return null;
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
  if (!Number.isInteger(n) || !inRange(Math.abs(n), 0, 200_000)) return null;
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

const PLACES = ["one", "ten", "hundred", "thousand", "tenThousand", "lakh", "tenLakh", "crore", "tenCrore", "hundredCrore"] as const;

export type PlaceName = (typeof PLACES)[number];

export function primeWork(raw: string) {
  const text = raw.trim();
  if (!/^\d+$/.test(text)) return null;
  const n = Number(text);
  if (!Number.isSafeInteger(n) || n < 1 || n > 1_000_000_000_000) return null;
  let prime = n > 1;
  if (n > 3 && (n % 2 === 0 || n % 3 === 0)) prime = false;
  for (let i = 5; prime && i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) prime = false;
  }
  const rules = [2, 3, 4, 5, 6, 8, 9, 10, 11];
  return { prime, rules: rules.map((by) => ({ by, yes: n % by === 0 })) };
}

export function pythagoras(find: string, first: string, second: string) {
  const x = money(first);
  const y = money(second);
  if (!inRange(x, 0, BIG) || !inRange(y, 0, BIG) || x === 0 || y === 0) return null;
  if (find === "hyp") return round2(Math.hypot(x, y));
  if (x <= y) return null;
  return round2(Math.sqrt(x * x - y * y));
}

export function convertTime(way: string, raw: string) {
  const value = money(raw);
  if (!inRange(value, 0, BIG)) return null;
  if (way === "toMin") return { hours: 0, minutes: round2(value * 60), asMinutes: true };
  const hours = Math.floor(value / 60);
  const minutes = round2(value - hours * 60);
  return { hours, minutes, asMinutes: false };
}

export function addTime(hoursA: string, minutesA: string, hoursB: string, minutesB: string) {
  const read = (raw: string) => (raw.trim() === "" ? 0 : Number(raw));
  const values = [read(hoursA), read(minutesA), read(hoursB), read(minutesB)];
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > 100_000)) return null;
  const total = values[0] * 60 + values[1] + values[2] * 60 + values[3];
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export function roundNumber(raw: string, place: string) {
  const value = money(raw);
  const step = Number(place);
  if (!inRange(value, -BIG, BIG) || ![10, 100, 1000].includes(step)) return null;
  return Math.round(value / step) * step;
}

export function placeValue(raw: string) {
  const digits = raw.trim().replace(/^0+(?=\d)/, "");
  if (!/^\d+$/.test(digits) || digits.length > PLACES.length) return null;
  return [...digits].map((digit, index) => ({
    digit,
    place: PLACES[digits.length - 1 - index],
  }));
}

export function timesTable(raw: string) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 100) return null;
  return Array.from({ length: 20 }, (_, index) => {
    const step = index + 1;
    return `${n} × ${step} = ${n * step}`;
  });
}
