import type { UIMessage, UIMessageChunk } from "ai";

import { MAX_HISTORY, MAX_MESSAGE_CHARS } from "@/lib/limits";

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

export function prepareMessages(input: unknown): UIMessage[] | null {
  if (!Array.isArray(input)) return null;

  const cleaned: UIMessage[] = [];

  for (const item of input) {
    if (!item || typeof item !== "object") continue;

    const message = item as Partial<UIMessage>;
    if (message.role !== "user" && message.role !== "assistant") continue;
    if (!Array.isArray(message.parts)) continue;

    const text = textFromParts(message.parts);
    if (!text.trim()) continue;

    cleaned.push({
      id: typeof message.id === "string" ? message.id : crypto.randomUUID(),
      role: message.role,
      parts: [{ type: "text", text }],
    });
  }

  const recent = cleaned.slice(-MAX_HISTORY);
  const last = recent.at(-1);
  if (!last || last.role !== "user") return null;

  return recent;
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
