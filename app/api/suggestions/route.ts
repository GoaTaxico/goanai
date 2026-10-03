import { generateText } from "ai";

import { modelOptions, resolveModel } from "@/lib/models";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: { question?: unknown; answer?: unknown };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ suggestions: [] });
  }

  const question = typeof payload.question === "string" ? payload.question.slice(0, 500) : "";
  const answer = typeof payload.answer === "string" ? payload.answer.slice(0, 1500) : "";
  if (!question || !answer) return Response.json({ suggestions: [] });

  const model = resolveModel();
  if (!model) return Response.json({ suggestions: [] });

  try {
    const { text } = await generateText({
      model,
      maxRetries: 0,
      abortSignal: AbortSignal.any([AbortSignal.timeout(8_000), request.signal]),
      providerOptions: modelOptions(),
      instructions:
        "Write exactly 3 short follow-up questions the person might ask next. Use the same language as the user. Return only a JSON array of 3 strings.",
      prompt: `User:\n${question}\n\nAssistant:\n${answer}`,
    });
    const match = text.match(/\[[\s\S]*\]/);
    const parsed = match ? (JSON.parse(match[0]) as unknown) : [];
    const suggestions = Array.isArray(parsed)
      ? parsed
          .filter((item): item is string => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 3)
      : [];
    return Response.json({ suggestions });
  } catch (error) {
    console.error("[luqman] suggestions failed", error);
    return Response.json({ suggestions: [] });
  }
}
