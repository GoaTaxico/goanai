import { getClientIp, peekDailyMessage } from "@/lib/rate-limit";

export const runtime = "nodejs";

export function GET(request: Request) {
  const usage = peekDailyMessage(getClientIp(request));
  return Response.json(usage, {
    headers: { "cache-control": "no-store" },
  });
}
