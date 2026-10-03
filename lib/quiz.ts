export const QUIZ_TOTAL = 5;

export type QuizMark = "start" | "right" | "wrong" | "done";

export type QuizOption = {
  letter: string;
  label: string;
};

export type QuizView = {
  mark: QuizMark;
  note: string;
  hint: string;
  score: number;
  ask: number;
  total: number;
  question: string;
  options: QuizOption[];
};

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function parseQuiz(text: string): QuizView | null {
  const match = text.match(/@@quiz\s*([\s\S]*?)@@/i);
  if (!match) return null;

  const fields = new Map<string, string>();
  const options: QuizOption[] = [];
  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const option = trimmed.match(/^([A-D])\s*[:.)-]\s*(.+)$/i);
    if (option?.[1] && option[2]) {
      const letter = option[1].toUpperCase();
      if (!options.some((item) => item.letter === letter)) {
        options.push({ letter, label: option[2].trim() });
      }
      continue;
    }
    const field = trimmed.match(/^(mark|note|score|ask|question|hint)\s*:\s*(.*)$/i);
    if (field?.[1]) fields.set(field[1].toLowerCase(), (field[2] ?? "").trim());
  }

  const markRaw = (fields.get("mark") || "start").toLowerCase();
  const mark: QuizMark =
    markRaw === "right" || markRaw === "wrong" || markRaw === "done" || markRaw === "start" ? markRaw : "start";
  const question = fields.get("question") ?? "";
  if (mark !== "done" && (!question || options.length < 2)) return null;

  return {
    mark,
    note: fields.get("note") ?? "",
    hint: fields.get("hint") ?? "",
    score: clamp(Number(fields.get("score")), 0, QUIZ_TOTAL),
    ask: clamp(Number(fields.get("ask")), 1, QUIZ_TOTAL),
    total: QUIZ_TOTAL,
    question,
    options,
  };
}

export function visibleMessage(text: string) {
  const cut = text.search(/\n\[quiz\]/i);
  return (cut === -1 ? text : text.slice(0, cut)).trim();
}

export function readableMessage(text: string) {
  const quiz = parseQuiz(text);
  if (!quiz) return visibleMessage(text);
  if (quiz.mark === "done") {
    return [quiz.note, `${quiz.score} of ${quiz.total}`].filter(Boolean).join("\n");
  }
  const lines = [];
  if (quiz.note && quiz.mark !== "start") lines.push(quiz.note);
  lines.push(quiz.question);
  for (const option of quiz.options) lines.push(`${option.letter}. ${option.label}`);
  return lines.join("\n");
}

export function quizBrief(input: {
  kind: "start" | "answer";
  topic?: string;
  material?: string;
  photo?: boolean;
  language: string;
  level?: string;
}) {
  if (input.kind === "answer") {
    return `[quiz]
The line above is my answer.
Mark it, then ask the next question in the quiz block.
Add a hint line: one short clue that does not name the correct choice.
If this was question 5, finish the quiz and leave hint empty.
Language: ${input.language}
${input.level ? `Level: Class ${input.level} in an Indian school.` : ""}
[/quiz]`;
  }

  const topic = input.topic?.trim() || "a school topic a student in India can answer";
  const material = input.material?.trim()
    ? `Use only this material for the questions:\n${input.material.trim().slice(0, 1500)}`
    : "";
  const photo = input.photo ? "Base every question on the attached homework photo." : "";

  return `[quiz]
Start a multiple-choice quiz of ${QUIZ_TOTAL} questions, one at a time.
Topic: ${topic}
Language: ${input.language}
${input.level ? `Level: Class ${input.level} in an Indian school. Use words and facts a student in that class can handle.` : ""}
${photo}
${material}
Ask question 1 now. Include a hint line: one short clue that does not name the correct choice. Use the quiz block and do not write anything outside it.
[/quiz]`;
}
