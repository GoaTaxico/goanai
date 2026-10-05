"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Homework = {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
};

const HOMEWORK_KEY = "bharat-ai-homework";
const listeners = new Set<() => void>();
const emptyHomework: Homework[] = [];
let items: Homework[] = emptyHomework;
let loaded = false;

function readHomework() {
  if (!loaded || typeof window === "undefined") return emptyHomework;
  return items;
}

function loadHomework() {
  if (loaded) return;
  loaded = true;
  try {
    const parsed = JSON.parse(localStorage.getItem(HOMEWORK_KEY) ?? "[]") as unknown;
    items = Array.isArray(parsed)
      ? parsed.filter(
          (item): item is Homework =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as Homework).id === "string" &&
            typeof (item as Homework).text === "string" &&
            typeof (item as Homework).done === "boolean" &&
            typeof (item as Homework).createdAt === "number",
        )
      : emptyHomework;
  } catch {
    items = emptyHomework;
  }
  if (items.length === 0) items = emptyHomework;
}

function writeHomework(next: Homework[]) {
  loaded = true;
  const stored = next.slice(0, 40);
  items = stored.length === 0 ? emptyHomework : stored;
  try {
    localStorage.setItem(HOMEWORK_KEY, JSON.stringify(items));
  } catch {
    // The list still appears until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useHomework() {
  useEffect(() => {
    loadHomework();
    listeners.forEach((listener) => listener());
  }, []);
  return useSyncExternalStore(subscribe, readHomework, () => emptyHomework);
}

export function addHomework(text: string) {
  const trimmed = text.trim().slice(0, 200);
  if (!trimmed) return;
  writeHomework([{ id: crypto.randomUUID(), text: trimmed, done: false, createdAt: Date.now() }, ...readHomework()]);
}

export function toggleHomework(id: string) {
  writeHomework(readHomework().map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
}

export function removeHomework(id: string) {
  writeHomework(readHomework().filter((item) => item.id !== id));
}
