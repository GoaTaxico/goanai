"use client";

import { useEffect, useSyncExternalStore } from "react";

export type QuizScore = {
  id: string;
  topic: string;
  score: number;
  total: number;
  createdAt: number;
};

const SCORE_KEY = "bharat-ai-scores";
const listeners = new Set<() => void>();
const emptyScores: QuizScore[] = [];
let scores: QuizScore[] = emptyScores;
let loaded = false;

function isScore(item: unknown): item is QuizScore {
  if (!item || typeof item !== "object") return false;
  const row = item as QuizScore;
  return (
    typeof row.id === "string" &&
    typeof row.topic === "string" &&
    typeof row.score === "number" &&
    typeof row.total === "number" &&
    typeof row.createdAt === "number"
  );
}

function readScores() {
  if (!loaded || typeof window === "undefined") return emptyScores;
  return scores;
}

function loadScores() {
  if (loaded) return;
  loaded = true;
  try {
    const parsed = JSON.parse(localStorage.getItem(SCORE_KEY) ?? "[]") as unknown;
    scores = Array.isArray(parsed) ? parsed.filter(isScore) : emptyScores;
  } catch {
    scores = emptyScores;
  }
  if (scores.length === 0) scores = emptyScores;
}

function writeScores(next: QuizScore[]) {
  loaded = true;
  scores = next.length === 0 ? emptyScores : next.slice(0, 8);
  try {
    localStorage.setItem(SCORE_KEY, JSON.stringify(scores));
  } catch {
    // The score still appears until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useScores() {
  useEffect(() => {
    loadScores();
    listeners.forEach((listener) => listener());
  }, []);
  return useSyncExternalStore(subscribe, readScores, () => emptyScores);
}

export function saveScore(input: QuizScore) {
  loadScores();
  const current = readScores();
  if (current.some((item) => item.id === input.id)) return;
  writeScores([
    {
      id: input.id,
      topic: input.topic.trim().slice(0, 80),
      score: input.score,
      total: input.total,
      createdAt: input.createdAt,
    },
    ...current,
  ]);
}
