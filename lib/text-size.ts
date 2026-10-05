"use client";

import { useEffect, useSyncExternalStore } from "react";

export type TextSize = "sm" | "md" | "lg";

const TEXT_KEY = "bharat-ai-text";
const listeners = new Set<() => void>();
let size: TextSize = "md";
let loaded = false;

function readSize() {
  return loaded ? size : "md";
}

function loadSize() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const saved = localStorage.getItem(TEXT_KEY);
  size = saved === "sm" || saved === "lg" ? saved : "md";
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function useTextSize() {
  useEffect(() => {
    loadSize();
    emit();
  }, []);
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    readSize,
    () => "md" as TextSize,
  );
}

export function setTextSize(next: TextSize) {
  loadSize();
  loaded = true;
  size = next;
  try {
    localStorage.setItem(TEXT_KEY, next);
  } catch {
    // The size still applies until the page is closed.
  }
  emit();
}
