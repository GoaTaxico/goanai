"use client";

import { useState } from "react";

import type { Copy } from "@/lib/copy";
import type { QuizView } from "@/lib/quiz";

type QuizCardProps = {
  copy: Copy;
  quiz: QuizView;
  live: boolean;
  onChoose: (letter: string, label: string) => void;
};

export function QuizCard({ copy, quiz, live, onChoose }: QuizCardProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const finished = quiz.mark === "done";
  const progress = finished ? 100 : Math.round((quiz.ask / quiz.total) * 100);
  const score = copy.quizScore.replace("{score}", String(quiz.score)).replace("{total}", String(quiz.total));
  const heading = finished
    ? copy.quizDone
    : copy.quizQuestion.replace("{ask}", String(quiz.ask)).replace("{total}", String(quiz.total));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-indigo">
        <span>{heading}</span>
        {quiz.mark === "start" ? null : <span>{score}</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-sand" aria-hidden="true">
        <div className="h-full rounded-full bg-peacock" style={{ width: `${progress}%` }} />
      </div>
      {quiz.mark === "right" || quiz.mark === "wrong" || finished ? (
        <p className={`text-sm font-semibold ${quiz.mark === "wrong" ? "text-terracotta" : "text-peacock"}`}>
          {finished ? copy.quizDone : quiz.mark === "right" ? copy.quizRight : copy.quizWrong}
          {quiz.note ? <span className="mt-1 block font-normal text-foreground">{quiz.note}</span> : null}
        </p>
      ) : null}
      {finished || !quiz.question ? null : <p className="text-sm leading-6 text-foreground">{quiz.question}</p>}
      {finished || !quiz.hint ? null : (
        <div>
          <button
            type="button"
            aria-expanded={hintOpen}
            onClick={() => setHintOpen((open) => !open)}
            className="rounded-full border border-marigold/70 bg-paper px-3 py-1 text-xs font-semibold text-indigo"
          >
            {hintOpen ? copy.quizHideHint : copy.quizHint}
          </button>
          {hintOpen ? (
            <p className="mt-2 rounded-2xl bg-sand px-3 py-2 text-sm leading-6 text-foreground">{quiz.hint}</p>
          ) : null}
        </div>
      )}
      {finished ? null : (
        <div className="flex flex-col gap-2">
          {quiz.options.map((option) => (
            <button
              key={option.letter}
              type="button"
              disabled={!live}
              onClick={() => onChoose(option.letter, option.label)}
              className="flex w-full items-start gap-3 rounded-2xl border border-line bg-sand/50 px-3 py-2 text-left text-sm text-indigo transition hover:border-peacock disabled:cursor-default disabled:hover:border-line"
            >
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo text-xs font-semibold text-[#f7f3ea]">
                {option.letter}
              </span>
              <span className="pt-0.5 leading-5">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
