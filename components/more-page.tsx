"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Calculator } from "@/components/calculator";
import { Flashcards } from "@/components/flashcards";
import { Mark } from "@/components/mark";
import { StudyTimer } from "@/components/study-timer";
import { copy } from "@/lib/copy";
import { useBharatState } from "@/lib/chat-store";
import { upcomingHolidays } from "@/lib/holidays";
import { missedQuizMaterial, removeMiss, useMissed } from "@/lib/missed";
import { removeNote, useNotes } from "@/lib/notes";
import { queuePractice } from "@/lib/practice-queue";
import { useScores } from "@/lib/scores";

type Panel = "calc" | "notes" | "missed" | "scores" | "holidays" | "timer" | "cards";

function shareNote(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text.slice(0, 4000))}`, "_blank", "noopener,noreferrer");
}

function printNote(text: string) {
  const page = window.open("", "_blank", "noopener,noreferrer");
  if (!page) return;
  page.document.title = "Susegad";
  page.document.body.style.fontFamily = "sans-serif";
  page.document.body.style.whiteSpace = "pre-wrap";
  page.document.body.textContent = text;
  page.print();
}

function Glyph({ panel }: { panel: Panel }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (panel === "calc") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" rx="2" {...common} />
        <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" {...common} />
      </svg>
    );
  }
  if (panel === "notes") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" {...common} />
        <path d="M14 3v5h5M9 13h6M9 17h4" {...common} />
      </svg>
    );
  }
  if (panel === "missed") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="12" r="8" {...common} />
        <path d="M9.5 9.5a2.5 2.5 0 1 1 3.2 2.4c-.7.3-1.2.9-1.2 1.6V14" {...common} />
        <path d="M12 17h.01" {...common} />
      </svg>
    );
  }
  if (panel === "timer") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <circle cx="12" cy="13" r="7" {...common} />
        <path d="M12 13V10M9 3h6" {...common} />
      </svg>
    );
  }
  if (panel === "cards") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <rect x="7" y="5" width="12" height="14" rx="2" {...common} />
        <path d="M5 8v11a1 1 0 0 0 1 1h10" {...common} />
      </svg>
    );
  }
  if (panel === "scores") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
        <path d="M8 20V10M12 20V6M16 20v-6" {...common} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      <rect x="4" y="5" width="16" height="15" rx="2" {...common} />
      <path d="M8 3v4M16 3v4M4 10h16" {...common} />
    </svg>
  );
}

export function Shelf({ embedded = false, onBack, onDone }: { embedded?: boolean; onBack?: () => void; onDone?: () => void }) {
  const router = useRouter();
  const state = useBharatState();
  const text = copy[state.lang];
  const notes = useNotes();
  const missed = useMissed();
  const scores = useScores();
  const holidays = upcomingHolidays();
  const [panel, setPanel] = useState<Panel | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.lang =
      state.lang === "kok" ? "kok" : state.lang === "mr" ? "mr" : state.lang === "hi" ? "hi" : "en";
  }, [state.lang]);

  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
  }, [panel]);

  const titles: Record<Panel, string> = {
    calc: text.calc,
    notes: text.notes,
    missed: text.missed,
    scores: text.scores,
    holidays: text.holidays,
    timer: text.timer,
    cards: text.flashcards,
  };

  function startQuiz(id: string, topic: string, material: string) {
    queuePractice({ id, topic, material });
    router.push("/");
    onDone?.();
  }

  const nextHoliday = holidays[0];
  const latest = scores[0];
  const menu: { id: Panel; hint: string; wide?: boolean }[] = [
    { id: "calc", hint: text.calcNote, wide: true },
    { id: "notes", hint: notes.length === 0 ? text.emptyNotes : String(notes.length) },
    { id: "missed", hint: missed.length === 0 ? text.emptyMissed : String(missed.length) },
    { id: "scores", hint: latest ? `${latest.score}/${latest.total}` : text.emptyScores },
    { id: "cards", hint: missed.length === 0 ? text.flashEmpty : String(missed.length) },
    { id: "timer", hint: text.timerNote },
    { id: "holidays", hint: nextHoliday ? `${nextHoliday.label} · ${nextHoliday.name}` : text.holidayNote },
  ];

  const backControl = (
    <button
      type="button"
      aria-label={text.back}
      onClick={() => (panel ? setPanel(null) : onBack?.())}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#f2c98a]/50 bg-white/5 text-lg"
    >
      ←
    </button>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col text-[#f7f3ea]">
      <header className={`flex w-full items-center gap-3 px-4 py-3 ${embedded ? "" : "mx-auto max-w-2xl"}`}>
        {panel || embedded ? (
          backControl
        ) : (
          <Link
            href="/"
            aria-label={text.back}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#f2c98a]/50 bg-white/5 text-lg"
          >
            ←
          </Link>
        )}
        <div className="min-w-0 flex-1">
          {embedded ? null : (
            <p className={`text-[0.7rem] font-semibold text-[#f2c98a] ${state.lang === "en" ? "uppercase tracking-[0.22em]" : ""}`}>{text.brand}</p>
          )}
          <h1 className="truncate font-display text-2xl leading-none tracking-wide sm:text-3xl">{panel ? titles[panel] : text.shelf}</h1>
        </div>
        {panel || embedded ? null : <Mark className="h-12 w-12 shrink-0" />}
      </header>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {panel === null ? (
          <nav className={`grid w-full gap-2 px-3 py-2 ${embedded ? "" : "mx-auto my-auto max-w-2xl gap-3 px-4 py-6 sm:grid-cols-2"}`}>
            {menu.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPanel(item.id)}
                className={`tile-card flex items-center gap-3 rounded-3xl px-3 py-3 text-left text-indigo ${!embedded && item.wide ? "sm:col-span-2" : ""}`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-sand text-peacock">
                  <Glyph panel={item.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block font-display tracking-wide ${embedded ? "text-xl leading-tight" : item.wide ? "text-3xl leading-none" : "text-2xl leading-tight"}`}>{titles[item.id]}</span>
                  <span className="mt-1 line-clamp-2 text-sm leading-5 text-muted">{item.hint}</span>
                </span>
                <span className="text-2xl leading-none text-brass" aria-hidden="true">
                  ›
                </span>
              </button>
            ))}
            {embedded ? null : <p className="px-1 pt-2 text-sm leading-6 text-[#c9ddd8] sm:col-span-2">{text.mood}</p>}
          </nav>
        ) : null}

        {panel === "calc" ? (
          <div className="mx-auto w-full max-w-2xl px-4 pb-10">
            <div className="rounded-[1.6rem] bg-[#041f25] px-2 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)] ring-1 ring-white/10">
              <p className="px-4 pb-3 text-sm leading-5 text-[#c9ddd8]">{text.calcNote}</p>
              <Calculator copy={text} bare />
            </div>
          </div>
        ) : null}

        {panel === "notes" ? (
          <section className="mx-auto w-full max-w-2xl px-4 pb-10">
            <div className="rounded-[1.6rem] bg-paper px-4 py-4 text-indigo shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              {notes.length === 0 ? (
                <p className="text-sm leading-6 text-muted">{text.emptyNotes}</p>
              ) : (
                <ul className="space-y-3">
                  {notes.map((note) => (
                    <li key={note.id} className="border-b border-line pb-3 last:border-b-0 last:pb-0">
                      <p className="text-sm leading-6">{note.text}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          onClick={() => shareNote(note.text)}
                          className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-peacock"
                        >
                          {text.shareNote}
                        </button>
                        <button
                          type="button"
                          onClick={() => printNote(note.text)}
                          className="rounded-full border border-line px-3 py-1 text-xs font-semibold text-peacock"
                        >
                          {text.printNote}
                        </button>
                        <button
                          type="button"
                          aria-label={text.deleteNote}
                          onClick={() => removeNote(note.id)}
                          className="ml-auto grid h-7 w-7 place-items-center rounded-full text-terracotta"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}

        {panel === "missed" ? (
          <section className="mx-auto w-full max-w-2xl px-4 pb-10">
            <div className="rounded-[1.6rem] bg-paper px-4 py-4 text-indigo shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              {missed.length > 0 ? (
                <button
                  type="button"
                  onClick={() => startQuiz(missed.map((item) => item.id).join("-"), text.quizMissedTopic, missedQuizMaterial(missed))}
                  className="mb-4 w-full rounded-full bg-peacock px-3 py-2.5 text-sm font-semibold text-[#f7f3ea]"
                >
                  {text.quizMissedAll}
                </button>
              ) : null}
              {missed.length === 0 ? (
                <p className="text-sm leading-6 text-muted">{text.emptyMissed}</p>
              ) : (
                <ul className="space-y-2">
                  {missed.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => startQuiz(item.id, item.question, missedQuizMaterial([item]))}
                        className="min-w-0 flex-1 rounded-2xl px-1 py-1 text-left text-sm leading-6 hover:bg-sand"
                      >
                        {item.question}
                      </button>
                      <button
                        type="button"
                        aria-label={text.deleteMiss}
                        onClick={() => removeMiss(item.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-terracotta"
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}

        {panel === "scores" ? (
          <section className="mx-auto w-full max-w-2xl px-4 pb-10">
            <div className="rounded-[1.6rem] bg-paper px-4 py-4 text-indigo shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              {scores.length === 0 ? (
                <p className="text-sm leading-6 text-muted">{text.emptyScores}</p>
              ) : (
                <ul className="space-y-3">
                  {scores.map((item) => (
                    <li key={item.id} className="flex items-baseline gap-3 border-b border-line pb-3 last:border-b-0 last:pb-0">
                      <span className="font-display text-2xl leading-none text-peacock">
                        {item.score}/{item.total}
                      </span>
                      <span className="min-w-0 flex-1 text-sm leading-6">{item.topic}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ) : null}

        {panel === "timer" ? (
          <section className="mx-auto w-full max-w-2xl px-4 pb-10">
            <p className="pb-3 text-sm leading-5 text-[#c9ddd8]">{text.timerNote}</p>
            <div className="rounded-[1.6rem] bg-paper px-4 py-5 text-indigo shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <StudyTimer copy={text} />
            </div>
          </section>
        ) : null}

        {panel === "cards" ? (
          <section className="mx-auto w-full max-w-2xl px-4 pb-10">
            <div className="rounded-[1.6rem] bg-paper px-4 py-4 text-indigo shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <Flashcards copy={text} />
            </div>
          </section>
        ) : null}

        {panel === "holidays" ? (
          <section className="mx-auto w-full max-w-2xl px-4 pb-10">
            <p className="pb-3 text-sm leading-5 text-[#c9ddd8]">{text.holidayNote}</p>
            {holidays.length > 0 ? (
              <button
                type="button"
                onClick={() => shareNote(holidays.map((holiday) => `${holiday.label} ${holiday.name}`).join("\n"))}
                className="mb-3 w-full rounded-full border border-[#f2c98a]/50 px-3 py-2 text-sm text-[#f7f3ea] hover:bg-white/10"
              >
                {text.shareHolidays}
              </button>
            ) : null}
            <div className="rounded-[1.6rem] bg-paper px-4 py-4 text-indigo shadow-[0_16px_40px_rgba(0,0,0,0.18)]">
              <ul className="space-y-3">
                {holidays.map((holiday) => (
                  <li key={`${holiday.date}-${holiday.name}`} className="flex items-start gap-3">
                    <span className="shrink-0 rounded-full bg-sand px-2.5 py-1 text-xs font-semibold text-indigo">{holiday.label}</span>
                    <span className="min-w-0 pt-0.5 text-sm leading-6">{holiday.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function MorePage() {
  const state = useBharatState();

  useEffect(() => {
    document.documentElement.lang =
      state.lang === "kok" ? "kok" : state.lang === "mr" ? "mr" : state.lang === "hi" ? "hi" : "en";
  }, [state.lang]);

  return (
    <div className="shore flex h-dvh flex-col text-[#f7f3ea]">
      <div className="tide-bar shrink-0" />
      <Shelf />
    </div>
  );
}
