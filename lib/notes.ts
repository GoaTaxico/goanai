"use client";

import { useEffect, useSyncExternalStore } from "react";

export type Note = {
  id: string;
  text: string;
  createdAt: number;
};

const NOTES_KEY = "bharat-ai-notes";
const listeners = new Set<() => void>();
const emptyNotes: Note[] = [];
let notes: Note[] = emptyNotes;
let loaded = false;

function readNotes() {
  if (!loaded || typeof window === "undefined") return emptyNotes;
  return notes;
}

function loadNotes() {
  if (loaded) return;
  loaded = true;
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTES_KEY) ?? "[]") as unknown;
    notes = Array.isArray(parsed)
      ? parsed.filter(
          (item): item is Note =>
            Boolean(item) &&
            typeof item === "object" &&
            typeof (item as Note).id === "string" &&
            typeof (item as Note).text === "string" &&
            typeof (item as Note).createdAt === "number",
        )
      : emptyNotes;
  } catch {
    notes = emptyNotes;
  }
  if (notes.length === 0) notes = emptyNotes;
}

function writeNotes(next: Note[]) {
  loaded = true;
  const stored = next.slice(0, 30);
  notes = stored.length === 0 ? emptyNotes : stored;
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  } catch {
    // The note still appears until the page is closed.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useNotes() {
  useEffect(() => {
    loadNotes();
    listeners.forEach((listener) => listener());
  }, []);
  return useSyncExternalStore(subscribe, readNotes, () => emptyNotes);
}

export function saveNote(text: string) {
  const trimmed = text.trim().slice(0, 2000);
  if (!trimmed) return;
  writeNotes([{ id: crypto.randomUUID(), text: trimmed, createdAt: Date.now() }, ...readNotes()]);
}

export function removeNote(id: string) {
  writeNotes(readNotes().filter((note) => note.id !== id));
}
