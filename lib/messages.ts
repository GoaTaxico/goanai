import type { FileUIPart, UIMessage, UIMessageChunk } from "ai";

import { MAX_HISTORY, MAX_IMAGE_CHARS, MAX_MESSAGE_CHARS } from "@/lib/limits";

function textFromParts(parts: UIMessage["parts"]) {
  return parts
    .filter(
      (part): part is { type: "text"; text: string } =>
        part.type === "text" && typeof part.text === "string",
    )
    .map((part) => part.text)
    .join("")
    .slice(0, MAX_MESSAGE_CHARS);
}

function userImage(parts: UIMessage["parts"]): FileUIPart | null {
  for (const part of parts) {
    if (
      part.type === "file" &&
      part.mediaType === "image/jpeg" &&
      typeof part.url === "string" &&
      part.url.startsWith("data:image/jpeg;base64,") &&
      part.url.length <= MAX_IMAGE_CHARS
    ) {
      return {
        type: "file",
        mediaType: "image/jpeg",
        filename: "photo.jpg",
        url: part.url,
      };
    }
  }

  return null;
}

export function prepareMessages(input: unknown): UIMessage[] | null {
  if (!Array.isArray(input)) return null;

  const cleaned: Array<UIMessage & { image?: FileUIPart | null }> = [];

  for (const item of input) {
    if (!item || typeof item !== "object") continue;

    const message = item as Partial<UIMessage>;
    if (message.role !== "user" && message.role !== "assistant") continue;
    if (!Array.isArray(message.parts)) continue;

    const image = message.role === "user" ? userImage(message.parts) : null;
    const text = textFromParts(message.parts).trim();
    if (!text && !image) continue;

    cleaned.push({
      id: typeof message.id === "string" ? message.id : crypto.randomUUID(),
      role: message.role,
      parts: [{ type: "text", text: text || "Look at this picture." }],
      image,
    });
  }

  const recent = cleaned.slice(-MAX_HISTORY);
  let imagesLeft = 2;
  for (let index = recent.length - 1; index >= 0; index -= 1) {
    const message = recent[index];
    if (message.role === "user" && message.image && imagesLeft > 0) {
      imagesLeft -= 1;
      continue;
    }
    message.image = null;
  }

  const ready = recent.map(({ image, ...message }) => ({
    ...message,
    parts: image ? [...message.parts, image] : message.parts,
  }));
  const last = ready.at(-1);
  if (!last || last.role !== "user") return null;

  return ready;
}

export function redactStream(
  stream: ReadableStream<UIMessageChunk>,
): ReadableStream<UIMessageChunk> {
  return stream.pipeThrough(
    new TransformStream<UIMessageChunk, UIMessageChunk>({
      transform(chunk, controller) {
        if (
          chunk.type === "custom" ||
          chunk.type === "source-url" ||
          chunk.type === "source-document" ||
          chunk.type === "file" ||
          chunk.type === "reasoning-file" ||
          chunk.type === "reasoning-start" ||
          chunk.type === "reasoning-delta" ||
          chunk.type === "reasoning-end"
        ) {
          return;
        }

        if ("providerMetadata" in chunk && chunk.providerMetadata) {
          const copy = { ...chunk };
          delete copy.providerMetadata;
          controller.enqueue(copy);
          return;
        }

        controller.enqueue(chunk);
      },
    }),
  );
}
