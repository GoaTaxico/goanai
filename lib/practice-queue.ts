import type { PracticeQuiz } from "@/lib/quiz";

const PRACTICE_KEY = "bharat-ai-practice";

export function queuePractice(quiz: PracticeQuiz) {
  sessionStorage.setItem(PRACTICE_KEY, JSON.stringify(quiz));
}

export function takePractice(): PracticeQuiz | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(PRACTICE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(PRACTICE_KEY);
  try {
    const parsed = JSON.parse(raw) as PracticeQuiz;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.topic !== "string" || typeof parsed.material !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
