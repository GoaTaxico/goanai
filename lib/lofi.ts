"use client";

import { useSyncExternalStore } from "react";

export const MUSIC = ["lofi", "rain", "piano", "waves", "night", "bells"] as const;

export type Music = (typeof MUSIC)[number];

const LOFI = [
  [220, 261.63, 329.63, 392],
  [174.61, 220, 261.63, 329.63],
  [174.61, 220, 261.63, 349.23],
  [130.81, 196, 261.63, 329.63],
];

const PIANO = [440, 523.25, 659.25, 783.99, 659.25, 523.25, 392, 349.23];
const BELLS = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25];

const listeners = new Set<() => void>();
let current: Music | null = null;
let context: AudioContext | null = null;
let timers: number[] = [];
let tones: OscillatorNode[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

export function useMusic() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => null,
  );
}

function brownNoise(audio: AudioContext) {
  const length = audio.sampleRate * 2;
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  let brown = 0;
  for (let index = 0; index < length; index += 1) {
    const white = Math.random() * 2 - 1;
    brown = (brown + 0.02 * white) / 1.02;
    data[index] = brown * 3.2;
  }
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  return noise;
}

function tune(freqs: number[]) {
  if (!context) return;
  const now = context.currentTime;
  freqs.forEach((freq, index) => {
    const tone = tones[index];
    if (!tone) return;
    tone.frequency.cancelScheduledValues(now);
    tone.frequency.linearRampToValueAtTime(freq, now + 1.4);
  });
}

function chime(audio: AudioContext, master: GainNode, freq: number, peak: number, seconds: number) {
  const now = audio.currentTime;
  const tone = audio.createOscillator();
  tone.type = "sine";
  tone.frequency.value = freq;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  tone.connect(gain);
  gain.connect(master);
  tone.start(now);
  tone.stop(now + seconds + 0.05);
}

function stopGraph() {
  timers.forEach((id) => window.clearInterval(id));
  timers = [];
  tones.forEach((tone) => {
    try {
      tone.stop();
    } catch {
      // The tone is already stopped.
    }
  });
  tones = [];
  void context?.close();
  context = null;
  current = null;
  emit();
}

export function stopLofi() {
  if (!current && !context) return;
  stopGraph();
}

async function startMusic(kind: Music) {
  const audio = new AudioContext();
  context = audio;
  if (audio.state === "suspended") await audio.resume();
  const master = audio.createGain();
  master.gain.value = 1;
  const limiter = audio.createDynamicsCompressor();
  limiter.threshold.value = -2;
  limiter.knee.value = 3;
  limiter.ratio.value = 8;
  limiter.attack.value = 0.003;
  limiter.release.value = 0.18;
  master.connect(limiter);
  limiter.connect(audio.destination);

  if (kind === "lofi" || kind === "rain" || kind === "waves" || kind === "night") {
    const noise = brownNoise(audio);
    const filter = audio.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = kind === "waves" ? 420 : kind === "night" ? 280 : 640;
    const noiseGain = audio.createGain();
    noiseGain.gain.value = kind === "night" ? 0.9 : kind === "lofi" ? 0.85 : 1.7;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(master);
    noise.start();
    if (kind === "waves") {
      const sway = audio.createOscillator();
      sway.frequency.value = 0.08;
      const depth = audio.createGain();
      depth.gain.value = 280;
      sway.connect(depth);
      depth.connect(filter.frequency);
      sway.start();
      tones.push(sway);
    }
  }

  if (kind === "lofi") {
    tones.push(
      ...LOFI[0].map((freq) => {
        const tone = audio.createOscillator();
        tone.type = "triangle";
        tone.frequency.value = freq;
        const filter = audio.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 880;
        const gain = audio.createGain();
        gain.gain.value = 0.2;
        tone.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        tone.start();
        return tone;
      }),
    );
    let step = 0;
    timers.push(
      window.setInterval(() => {
        step = (step + 1) % LOFI.length;
        tune(LOFI[step]);
      }, 8000),
    );
  }

  if (kind === "night") {
    [110, 164.81, 220].forEach((freq) => {
      const tone = audio.createOscillator();
      tone.type = "sine";
      tone.frequency.value = freq;
      const gain = audio.createGain();
      gain.gain.value = 0.28;
      tone.connect(gain);
      gain.connect(master);
      tone.start();
      tones.push(tone);
    });
  }

  if (kind === "piano") {
    let step = 0;
    chime(audio, master, PIANO[0], 0.9, 1.6);
    timers.push(
      window.setInterval(() => {
        if (!context) return;
        step = (step + 1) % PIANO.length;
        chime(context, master, PIANO[step], 0.9, 1.6);
      }, 1400),
    );
  }

  if (kind === "bells") {
    let step = 0;
    chime(audio, master, BELLS[0], 0.85, 3.2);
    timers.push(
      window.setInterval(() => {
        if (!context) return;
        step = (step + 1) % BELLS.length;
        chime(context, master, BELLS[step], 0.85, 3.2);
      }, 2800),
    );
  }

  current = kind;
  emit();
}

export async function chooseMusic(next: Music) {
  if (current === next) {
    stopGraph();
    return;
  }
  stopGraph();
  await startMusic(next);
}
