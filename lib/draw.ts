import { ERROR_IMAGE_LIMIT, ERROR_UNAVAILABLE } from "@/lib/limits";

type Drawn =
  | { ok: true; url: string }
  | { ok: false; error: "image_limit" | "unavailable" | "failed" };

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function drawPicture(prompt: string, signal: AbortSignal): Promise<Drawn> {
  const created = await fetch("/api/image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  const payload = (await created.json()) as { id?: string; error?: string };
  if (!created.ok || !payload.id) {
    if (payload.error === ERROR_IMAGE_LIMIT) return { ok: false, error: "image_limit" };
    if (payload.error === ERROR_UNAVAILABLE) return { ok: false, error: "unavailable" };
    return { ok: false, error: "failed" };
  }

  const started = Date.now();
  while (Date.now() - started < 180_000) {
    await sleep(3000, signal);
    const polled = await fetch(`/api/image?id=${encodeURIComponent(payload.id)}`, { signal });
    const job = (await polled.json()) as { status?: string; url?: string };
    if (job.status === "succeeded" && job.url?.startsWith("/images/")) {
      return { ok: true, url: job.url };
    }
    if (job.status === "failed" || job.status === "blocked") {
      return { ok: false, error: "failed" };
    }
  }

  return { ok: false, error: "failed" };
}
