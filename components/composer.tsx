"use client";

import { useEffect, useRef, useState } from "react";
import type { ChatStatus, FileUIPart } from "ai";

import type { Copy, Lang } from "@/lib/copy";
import { MAX_MESSAGE_CHARS } from "@/lib/limits";
import { compressPhoto } from "@/lib/photo";

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type Outgoing = {
  text: string;
  image?: FileUIPart | null;
  draw: boolean;
  quiz: boolean;
  level?: string;
};

type ComposerProps = {
  copy: Copy;
  lang: Lang;
  status: ChatStatus;
  extraBusy: boolean;
  limitReached: boolean;
  remaining: number | null;
  onSend: (message: Outgoing) => boolean | Promise<boolean>;
  onStop: () => void;
};

function recognitionCtor() {
  if (typeof window === "undefined") return null;
  const host = window as Window & {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null;
}

export function Composer({
  copy,
  lang,
  status,
  extraBusy,
  limitReached,
  remaining,
  onSend,
  onStop,
}: ComposerProps) {
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<FileUIPart | null>(null);
  const [photoError, setPhotoError] = useState(false);
  const [draw, setDraw] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [level, setLevel] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const busy = status === "submitted" || status === "streaming" || extraBusy;
  const tooLong = text.length > MAX_MESSAGE_CHARS;
  const outOfMessages = limitReached || remaining === 0;
  const canSend =
    !outOfMessages &&
    !tooLong &&
    !busy &&
    (draw ? text.trim().length > 0 : quiz || text.trim().length > 0 || photo != null) &&
    (status === "ready" || status === "error" || extraBusy);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  function stopListening() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }

  function startListening() {
    const Ctor = recognitionCtor();
    if (!Ctor || busy || outOfMessages) {
      setVoiceError(true);
      return;
    }
    setVoiceError(false);
    stopListening();
    const recognition = new Ctor();
    recognition.lang = lang === "hi" ? "hi-IN" : lang === "kok" ? "kok-IN" : lang === "mr" ? "mr-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim() ?? "";
      if (!transcript) return;
      setText((current) => (current.trim() ? `${current.trim()} ${transcript}` : transcript));
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }

  async function submit() {
    if (!canSend) return;
    const next = text.trim();
    const image = draw ? null : photo;
    setText("");
    setPhoto(null);
    setPhotoError(false);
    const field = document.getElementById("bharat-message");
    if (field instanceof HTMLTextAreaElement) field.style.height = "";
    const ok = await onSend({ text: next, image, draw, quiz, level: quiz ? level : "" });
    if (ok) setQuiz(false);
    if (!ok) {
      setText(next);
      setPhoto(image);
    }
  }

  return (
    <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-4">
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-2 sm:gap-3">
        {photo ? (
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted"
            >
              {copy.cancel}
            </button>
          </div>
        ) : null}
        <form
          className="shell-input flex flex-col gap-1 rounded-[1.6rem] border-2 border-indigo p-2"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (!file) return;
              void compressPhoto(file).then((next) => {
                if (!next) {
                  setPhotoError(true);
                  return;
                }
                setPhotoError(false);
                setDraw(false);
                setPhoto(next);
              });
            }}
          />
          <div className="flex items-center gap-1 px-1">
          <button
            type="button"
            aria-label={copy.photo}
            disabled={outOfMessages || busy || draw}
            onClick={() => fileRef.current?.click()}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-indigo disabled:opacity-40"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <rect x="3" y="4" width="14" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <circle cx="8" cy="9" r="1.4" fill="currentColor" />
              <path d="M4 14l3.5-3 2.5 2 2-1.5L16 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-label={listening ? copy.voiceStop : copy.voice}
            disabled={outOfMessages || busy}
            onClick={() => (listening ? stopListening() : startListening())}
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border text-indigo disabled:opacity-40 ${
              listening ? "border-terracotta bg-[#f8e4dc] text-terracotta" : "border-line"
            }`}
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <rect x="8" y="2.5" width="4" height="9" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" />
              <path d="M5.5 9.5a4.5 4.5 0 0 0 9 0M10 14v3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            aria-pressed={draw}
            disabled={outOfMessages || busy}
            onClick={() => {
              setDraw((current) => !current);
              setQuiz(false);
              setPhoto(null);
            }}
            className={`h-10 shrink-0 rounded-full border px-3 text-xs font-semibold disabled:opacity-40 ${
              draw ? "border-marigold bg-marigold text-indigo" : "border-line text-indigo"
            }`}
          >
            {copy.draw}
          </button>
          <button
            type="button"
            aria-pressed={quiz}
            disabled={outOfMessages || busy}
            onClick={() => {
              setQuiz((current) => !current);
              setDraw(false);
            }}
            className={`h-10 shrink-0 rounded-full border px-3 text-xs font-semibold disabled:opacity-40 ${
              quiz ? "border-marigold bg-marigold text-indigo" : "border-line text-indigo"
            }`}
          >
            {copy.quiz}
          </button>
          </div>
          {quiz ? (
            <div className="flex flex-wrap gap-2 px-1">
              {[copy.quizMaths, copy.quizScience, copy.quizEnglish, copy.quizHindi, copy.quizGk].map((subject) => (
                <button
                  key={subject}
                  type="button"
                  aria-pressed={text.trim() === subject}
                  onClick={() => setText((current) => (current.trim() === subject ? "" : subject))}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    text.trim() === subject
                      ? "border-marigold bg-marigold text-indigo"
                      : "border-line bg-paper text-indigo"
                  }`}
                >
                  {subject}
                </button>
              ))}
              {[
                ["5", copy.quizClass5],
                ["8", copy.quizClass8],
                ["10", copy.quizClass10],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={level === value}
                  onClick={() => setLevel((current) => (current === value ? "" : value))}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    level === value ? "border-peacock bg-peacock text-[#f7f3ea]" : "border-line bg-paper text-indigo"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="flex items-end gap-2">
          <label className="sr-only" htmlFor="bharat-message">
            {quiz ? copy.quizPlaceholder : draw ? copy.drawPlaceholder : copy.placeholder}
          </label>
          <textarea
            id="bharat-message"
            rows={1}
            value={text}
            disabled={outOfMessages}
            placeholder={
              listening ? copy.listening : quiz ? copy.quizPlaceholder : draw ? copy.drawPlaceholder : copy.placeholder
            }
            onChange={(event) => {
              setText(event.target.value);
              const field = event.target;
              field.style.height = "0px";
              field.style.height = `${Math.min(field.scrollHeight, 160)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void submit();
              }
            }}
            className="max-h-40 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted disabled:opacity-60 sm:px-3"
          />
          {busy ? (
            <button
              type="button"
              onClick={onStop}
              className="shrink-0 rounded-full border border-terracotta px-4 py-2 text-sm font-semibold text-terracotta"
            >
              {copy.stop}
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              className={`send-btn shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 sm:px-5 ${canSend ? "is-ready" : ""}`}
            >
              {quiz ? copy.quiz : draw ? copy.draw : copy.send}
            </button>
          )}
          </div>
        </form>
        {tooLong ? <p className="text-sm text-terracotta">{copy.tooLong}</p> : null}
        {photoError ? <p className="text-sm text-terracotta">{copy.photoFailed}</p> : null}
        {voiceError ? <p className="text-sm text-terracotta">{copy.voiceFailed}</p> : null}
        {remaining != null ? (
          <p className="text-center text-xs text-muted">
            {copy.remaining.replace("{count}", String(remaining))}
          </p>
        ) : null}
        <p className="text-center text-xs text-muted">
          {copy.madeBefore}
          <a
            href="https://coastalcode.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-peacock underline underline-offset-2"
          >
            {copy.madeName}
          </a>
          {" ("}
          <a
            href="https://coastalcode.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-peacock underline underline-offset-2"
          >
            {copy.madeStudio}
          </a>
          {")"}
          {copy.madeAfter}
        </p>
      </div>
    </div>
  );
}
