import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";

import { ERROR_BUSY, ERROR_LIMIT, ERROR_UNAVAILABLE } from "@/lib/limits";
import { prepareMessages, redactStream } from "@/lib/messages";
import { BHARAT_INSTRUCTIONS, modelOptions, resolveModel } from "@/lib/models";
import { consumeDailyMessage, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 60;

function plain(body: string, status: number) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  let payload: { messages?: unknown };

  try {
    payload = await request.json();
  } catch {
    return plain(ERROR_BUSY, 400);
  }

  const model = resolveModel();
  const messages = prepareMessages(payload.messages);

  if (!model || !messages) {
    return plain(ERROR_BUSY, 400);
  }

  const usage = consumeDailyMessage(getClientIp(request));
  if (!usage.ok) {
    return plain(ERROR_LIMIT, 429);
  }

  try {
    const result = streamText({
      model,
      instructions: BHARAT_INSTRUCTIONS,
      messages: await convertToModelMessages(messages),
      abortSignal: request.signal,
      maxRetries: 0,
      providerOptions: modelOptions(),
    });

    return createUIMessageStreamResponse({
      stream: redactStream(
        toUIMessageStream({
          stream: result.stream,
          sendReasoning: false,
          sendSources: false,
          onError: (error) => {
            console.error("[bharat] stream failed", error);
            const status =
              typeof error === "object" && error && "statusCode" in error
                ? Number(error.statusCode)
                : 0;
            if (status === 401 || status === 402 || status === 403 || status === 404 || status === 429) {
              return ERROR_UNAVAILABLE;
            }
            return ERROR_BUSY;
          },
        }),
      ),
    });
  } catch (error) {
    console.error("[bharat] chat failed", error);
    return plain(ERROR_BUSY, 500);
  }
}
