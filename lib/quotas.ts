import "server-only";

import { istDay, visitorHash } from "@/lib/rate-limit";

const SEARCH_CAP = 15;
const FETCH_CAP = 15;
const IMAGE_ACCOUNT_CAP = 8;
const IMAGE_VISITOR_CAP = 2;

type Bucket = { day: string; count: number };

const globalStore = globalThis as typeof globalThis & {
  __susegadQuotas?: {
    search: Bucket;
    searchBlocked: boolean;
    images: Bucket;
    imagesBlocked: boolean;
    visitors: Map<string, Bucket>;
    jobs: Set<string>;
    saved: Map<string, string>;
    fetch: Bucket;
    fetchBlocked: boolean;
  };
};

const quotas = globalStore.__susegadQuotas ?? {
  search: { day: "", count: 0 },
  searchBlocked: false,
  images: { day: "", count: 0 },
  imagesBlocked: false,
  visitors: new Map<string, Bucket>(),
  jobs: new Set<string>(),
  saved: new Map<string, string>(),
  fetch: { day: "", count: 0 },
  fetchBlocked: false,
};
if (!quotas.saved) quotas.saved = new Map<string, string>();
if (!quotas.fetch) quotas.fetch = { day: "", count: 0 };
if (quotas.fetchBlocked === undefined) quotas.fetchBlocked = false;
globalStore.__susegadQuotas = quotas;

function fresh(bucket: Bucket) {
  const day = istDay();
  if (bucket.day !== day) {
    bucket.day = day;
    bucket.count = 0;
    return true;
  }
  return false;
}

export function canSearch() {
  if (fresh(quotas.search)) quotas.searchBlocked = false;
  return !quotas.searchBlocked && quotas.search.count < SEARCH_CAP;
}

export function noteSearch() {
  fresh(quotas.search);
  quotas.search.count += 1;
  if (quotas.search.count >= SEARCH_CAP) quotas.searchBlocked = true;
}

export function blockSearch() {
  fresh(quotas.search);
  quotas.searchBlocked = true;
}

export function canFetch() {
  if (fresh(quotas.fetch)) quotas.fetchBlocked = false;
  return !quotas.fetchBlocked && quotas.fetch.count < FETCH_CAP;
}

export function noteFetch() {
  fresh(quotas.fetch);
  quotas.fetch.count += 1;
  if (quotas.fetch.count >= FETCH_CAP) quotas.fetchBlocked = true;
}

export function blockFetch() {
  fresh(quotas.fetch);
  quotas.fetchBlocked = true;
}

export function takeImage(ip: string) {
  if (fresh(quotas.images)) quotas.imagesBlocked = false;
  if (quotas.imagesBlocked || quotas.images.count >= IMAGE_ACCOUNT_CAP) {
    return false;
  }

  const day = istDay();
  const key = visitorHash(ip);
  const current = quotas.visitors.get(key);
  const count = current?.day === day ? current.count : 0;
  if (count >= IMAGE_VISITOR_CAP) return false;

  quotas.images.count += 1;
  quotas.visitors.set(key, { day, count: count + 1 });
  if (quotas.visitors.size > 5_000) {
    for (const [storedKey, bucket] of quotas.visitors) {
      if (bucket.day !== day) quotas.visitors.delete(storedKey);
    }
  }
  return true;
}

export function releaseImage(ip: string) {
  fresh(quotas.images);
  quotas.images.count = Math.max(0, quotas.images.count - 1);
  const key = visitorHash(ip);
  const current = quotas.visitors.get(key);
  if (current?.day === istDay()) {
    current.count = Math.max(0, current.count - 1);
  }
}

export function blockImages() {
  fresh(quotas.images);
  quotas.imagesBlocked = true;
}

export function rememberImageJob(id: string) {
  quotas.jobs.add(id);
  if (quotas.jobs.size > 200) {
    const first = quotas.jobs.values().next().value;
    if (first) quotas.jobs.delete(first);
  }
}

export function knownImageJob(id: string) {
  return quotas.jobs.has(id);
}

export function localImageFor(jobId: string) {
  return quotas.saved.get(jobId) ?? null;
}

export function rememberLocalImage(jobId: string, url: string) {
  quotas.saved.set(jobId, url);
}
