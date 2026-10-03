import "server-only";

import { createHash } from "node:crypto";

type Bucket = {
  day: string;
  count: number;
};

const globalStore = globalThis as typeof globalThis & {
  __bharatRateLimit?: Map<string, Bucket>;
};

const buckets = globalStore.__bharatRateLimit ?? new Map<string, Bucket>();
globalStore.__bharatRateLimit = buckets;

function dailyLimit() {
  const parsed = Number(process.env.DAILY_MESSAGE_LIMIT ?? 50);
  if (!Number.isFinite(parsed) || parsed < 1) return 50;
  return Math.floor(parsed);
}

export function visitorHash(ip: string) {
  const salt = process.env.RATE_LIMIT_SALT || "bharat-ai";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

function hashVisitor(ip: string) {
  return visitorHash(ip);
}

export function istDay(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  return realIp || "local";
}

export function peekDailyMessage(ip: string) {
  const limit = dailyLimit();
  const day = istDay();
  const current = buckets.get(hashVisitor(ip));
  const count = current?.day === day ? current.count : 0;
  return { remaining: Math.max(0, limit - count), limit };
}

export function consumeDailyMessage(ip: string) {
  const limit = dailyLimit();
  const day = istDay();
  const key = hashVisitor(ip);
  const current = buckets.get(key);
  const count = current?.day === day ? current.count : 0;

  if (buckets.size > 5_000) {
    for (const [storedKey, bucket] of buckets) {
      if (bucket.day !== day) buckets.delete(storedKey);
    }
  }

  if (count >= limit) {
    return { ok: false as const, remaining: 0, limit };
  }

  buckets.set(key, { day, count: count + 1 });
  return { ok: true as const, remaining: limit - count - 1, limit };
}
