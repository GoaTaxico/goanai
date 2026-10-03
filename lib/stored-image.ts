import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const IMAGE_DIR = path.join(process.cwd(), "public", "images");

function extension(contentType: string) {
  if (contentType.includes("jpeg")) return "jpg";
  if (contentType.includes("webp")) return "webp";
  return "png";
}

export async function storeGeneratedImage(remoteUrl: string) {
  const response = await fetch(remoteUrl, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) return null;

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 32 || bytes.length > 8_000_000) return null;

  const name = `${randomUUID()}.${extension(response.headers.get("content-type") ?? "")}`;
  await mkdir(IMAGE_DIR, { recursive: true });
  await writeFile(path.join(IMAGE_DIR, name), bytes);
  return `/images/${name}`;
}
