"use client";

import { useEffect, useSyncExternalStore } from "react";

type TimerState = {
  running: boolean;
  endsAt: number | null;
  remaining: number;
  minutes: number;
};

const listeners = new Set<() => void>();
let timer: TimerState = { running: false, endsAt: null, remaining: 25 * 60, minutes: 25 };

function snapshot() {
  return timer;
}

function emit(next: TimerState) {
  timer = next;
  listeners.forEach((listener) => listener());
}

export function useStudyTimer() {
  const state = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    snapshot,
    snapshot,
  );

  useEffect(() => {
    if (!state.running) return;
    const id = window.setInterval(() => {
      if (!timer.running || timer.endsAt == null) return;
      const remaining = Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
      emit({
        ...timer,
        remaining,
        running: remaining > 0,
        endsAt: remaining > 0 ? timer.endsAt : null,
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [state.running]);

  return state;
}

export function setTimerMinutes(minutes: number) {
  const next = Math.min(180, Math.max(1, Math.round(minutes)));
  if (timer.running) return;
  emit({ ...timer, minutes: next, remaining: next * 60, endsAt: null });
}

export function startTimer() {
  if (timer.remaining <= 0) emit({ ...timer, remaining: timer.minutes * 60 });
  emit({ ...timer, running: true, endsAt: Date.now() + Math.max(timer.remaining, 1) * 1000 });
}

export function pauseTimer() {
  const remaining = timer.endsAt == null ? timer.remaining : Math.max(0, Math.ceil((timer.endsAt - Date.now()) / 1000));
  emit({ ...timer, running: false, endsAt: null, remaining });
}

export function resetTimer() {
  emit({ running: false, endsAt: null, minutes: timer.minutes, remaining: timer.minutes * 60 });
}
