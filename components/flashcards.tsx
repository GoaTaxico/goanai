"use client";

import { useState } from "react";

import type { Copy } from "@/lib/copy";
import { useMissed } from "@/lib/missed";

export function Flashcards({ copy }: { copy: Copy }) {
  const missed = useMissed();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = missed[index] ?? missed[0];

  if (!card) {
    return <p className="text-sm leading-6 text-muted">{copy.flashEmpty}</p>;
  }

  const place = Math.min(index, missed.length - 1);

  return (
    <div>
      <button
        type="button"
        onClick={() => setFlipped((open) => !open)}
        className="min-h-36 w-full rounded-3xl bg-sand px-4 py-5 text-left"
      >
        {flipped ? (
          <div className="space-y-2 text-sm leading-6">
            {card.note ? <p>{card.note}</p> : null}
            <ul>
              {card.options.map((option) => (
                <li key={option.letter}>
                  {option.letter}. {option.label}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="font-display text-2xl leading-tight">{card.question}</p>
        )}
      </button>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setFlipped(false);
            setIndex((place + missed.length - 1) % missed.length);
          }}
          className="grid h-10 w-10 place-items-center rounded-full border border-line text-lg"
          aria-label={copy.back}
        >
          ←
        </button>
        <button
          type="button"
          onClick={() => setFlipped((open) => !open)}
          className="flex-1 rounded-full bg-peacock px-3 py-2 text-sm font-semibold text-[#f7f3ea]"
        >
          {copy.flashFlip}
        </button>
        <button
          type="button"
          onClick={() => {
            setFlipped(false);
            setIndex((place + 1) % missed.length);
          }}
          className="grid h-10 w-10 place-items-center rounded-full border border-line text-lg"
          aria-label={`${place + 1}/${missed.length}`}
        >
          →
        </button>
      </div>
    </div>
  );
}
