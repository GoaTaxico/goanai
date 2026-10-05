"use client";

import { useEffect } from "react";

import type { Copy } from "@/lib/copy";
import { chooseMusic, MUSIC, stopLofi, useMusic } from "@/lib/lofi";
import { pauseTimer, resetTimer, setTimerMinutes, startTimer, useStudyTimer } from "@/lib/study-timer";

function clock(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function StudyTimer({ copy }: { copy: Copy }) {
  const timer = useStudyTimer();
  const music = useMusic();
  const musicLabels = {
    lofi: copy.lofi,
    rain: copy.musicRain,
    piano: copy.musicPiano,
    waves: copy.musicWaves,
    night: copy.musicNight,
    bells: copy.musicBells,
  };

  useEffect(() => {
    if (timer.remaining === 0) stopLofi();
  }, [timer.remaining]);

  return (
    <div className="text-center">
      <p className={`font-display text-6xl leading-none tracking-wide ${timer.remaining === 0 ? "text-terracotta" : "text-peacock"}`}>
        {clock(timer.remaining)}
      </p>
      {timer.remaining === 0 ? <p className="mt-2 text-sm font-semibold text-terracotta">{copy.timerDone}</p> : null}
      <label className="mt-4 block text-left">
        <span className="mb-1 block text-xs text-muted">{copy.timerMinutes}</span>
        <input
          type="number"
          min={1}
          max={180}
          value={timer.minutes}
          disabled={timer.running}
          onChange={(event) => setTimerMinutes(Number(event.target.value))}
          className="w-full rounded-full border border-line bg-white px-3 py-2 text-sm text-indigo outline-none disabled:opacity-60"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => (timer.running ? pauseTimer() : startTimer())}
          className="flex-1 rounded-full bg-peacock px-3 py-2.5 text-sm font-semibold text-[#f7f3ea]"
        >
          {timer.running ? copy.timerPause : copy.timerStart}
        </button>
        <button
          type="button"
          onClick={resetTimer}
          className="rounded-full border border-line px-4 py-2.5 text-sm font-semibold text-indigo"
        >
          {copy.timerReset}
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {MUSIC.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={music === kind}
            onClick={() => void chooseMusic(kind)}
            className={`rounded-full px-3 py-2 text-sm font-semibold ${
              music === kind ? "bg-peacock text-[#f7f3ea]" : "border border-line text-indigo"
            }`}
          >
            {musicLabels[kind]}
          </button>
        ))}
      </div>
    </div>
  );
}
