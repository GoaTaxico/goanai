"use client";

import { useEffect, useSyncExternalStore } from "react";

export type MissedQuestion = {
  id: string;
  question: string;
  options: { letter: string; label: string }[];
  note: string;
  createdAt: number;
};

const MISSED_KEY = "bharat-ai-missed";
const listeners = new Set<() => void>();
const emptyMissed: MissedQuestion[] = [];
let missed: MissedQuestion[] = emptyMissed;
let loaded = false;

function isMiss(item: unknown): item is MissedQuestion {
  if (!item || typeof item !== "object") return false;
  const row = item as MissedQuestion;
  return (
    typeof row.id === "string" &&
    typeof row.question === "string" &&
    typeof row.note === "string" &&
    typeof row.createdAt === "number" &&
    Array.isArray(row.options)
  );
}

function readMissed() {
  if (!loaded || typeof window === "undefined") return emptyMissed;
  return missed;
}

function loadMissed() {
  if (loaded) return;
  loaded = true;
  try {
    const parsed = JSON.parse(localStorage.getItem(MISSED_KEY) ?? "[]") as unknown;
    missed = Array.isArray(parsed) ? parsed.filter(isMiss) : emptyMissed;
  } catch {
    missed = emptyMissed;
  }
  if (missed.length === 0) missed = emptyMissed;
}

function writeMissed(next: MissedQuestion[]) {
  loaded = true;
  missed = next.length === 0 ? emptyMissed : next.slice(0, 20);
  try {
    localStorage.setItem(MISSED_KEY, JSON.stringify(missed));
  } catch {
    // The question still appears until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useMissed() {
  useEffect(() => {
    loadMissed();
    listeners.forEach((listener) => listener());
  }, []);
  return useSyncExternalStore(subscribe, readMissed, () => emptyMissed);
}

export function saveMiss(input: Omit<MissedQuestion, "id" | "createdAt">) {
  loadMissed();
  const question = input.question.trim().slice(0, 300);
  if (!question) return;
  const current = readMissed();
  if (current.some((item) => item.question === question)) return;
  writeMissed([
    {
      id: crypto.randomUUID(),
      question,
      options: input.options.slice(0, 4),
      note: input.note.trim().slice(0, 300),
      createdAt: Date.now(),
    },
    ...current,
  ]);
}

export function missedQuizMaterial(items: MissedQuestion[]) {
  return items
    .map((item) =>
      [item.question, ...item.options.map((option) => `${option.letter}. ${option.label}`), item.note]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
}

export function removeMiss(id: string) {
  loadMissed();
  writeMissed(readMissed().filter((item) => item.id !== id));
}
