import { ERROR_BUSY, ERROR_IMAGE_LIMIT, ERROR_UNAVAILABLE } from "@/lib/limits";
import { blockImages, knownImageJob, releaseImage, rememberImageJob, takeImage } from "@/lib/quotas";
import { getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const IMAGE_MODEL = "sensenova/sensenova-u1.5-lite";

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function authHeaders() {
  const key = process.env.XKIRO_API_KEY?.trim();
  if (!key) return null;
  return {
    Authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
}

export async function POST(request: Request) {
  const headers = authHeaders();
  if (!headers) return json({ error: ERROR_UNAVAILABLE }, 503);

  let prompt = "";
  try {
    const payload = (await request.json()) as { prompt?: unknown };
    prompt = typeof payload.prompt === "string" ? payload.prompt.trim().slice(0, 800) : "";
  } catch {
    return json({ error: ERROR_BUSY }, 400);
  }
  if (prompt.length < 2) return json({ error: ERROR_BUSY }, 400);

  const ip = getClientIp(request);
  if (!takeImage(ip)) return json({ error: ERROR_IMAGE_LIMIT }, 429);

  try {
    const response = await fetch("https://api.xkiro.com/v1/images/generations", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt,
        n: 1,
        size: "1024x1024",
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status === 402) {
      blockImages();
      releaseImage(ip);
      return json({ error: ERROR_IMAGE_LIMIT }, 429);
    }
    if (!response.ok) {
      releaseImage(ip);
      return json({ error: ERROR_BUSY }, 502);
    }

    const job = (await response.json()) as { id?: string };
    if (!job.id) {
      releaseImage(ip);
      return json({ error: ERROR_BUSY }, 502);
    }
    rememberImageJob(job.id);
    return json({ id: job.id });
  } catch {
    releaseImage(ip);
    return json({ error: ERROR_BUSY }, 502);
  }
}

export async function GET(request: Request) {
  const headers = authHeaders();
  if (!headers) return json({ error: ERROR_UNAVAILABLE }, 503);

  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(id) || !knownImageJob(id)) {
    return json({ error: ERROR_BUSY }, 404);
  }

  try {
    const response = await fetch(`https://api.xkiro.com/v1/images/generations/${id}`, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) return json({ status: "failed" }, 502);

    const job = (await response.json()) as {
      status?: string;
      data?: Array<{ url?: string }>;
    };
    const url = job.data?.find((item) => typeof item.url === "string" && item.url.startsWith("https://"))?.url;
    return json({ status: job.status ?? "processing", url });
  } catch {
    return json({ status: "processing" });
  }
}
