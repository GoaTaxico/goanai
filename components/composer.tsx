"use client";

import { useState } from "react";
import type { ChatStatus } from "ai";

import type { Copy } from "@/lib/copy";
import { MAX_MESSAGE_CHARS } from "@/lib/limits";

type ComposerProps = {
  copy: Copy;
  status: ChatStatus;
  limitReached: boolean;
  remaining: number | null;
  onSend: (text: string) => void;
  onStop: () => void;
};

export function Composer({
  copy,
  status,
  limitReached,
  remaining,
  onSend,
  onStop,
}: ComposerProps) {
  const [text, setText] = useState("");
  const busy = status === "submitted" || status === "streaming";
  const tooLong = text.length > MAX_MESSAGE_CHARS;
  const outOfMessages = limitReached || remaining === 0;
  const canSend =
    !outOfMessages &&
    !tooLong &&
    !busy &&
    text.trim().length > 0 &&
    (status === "ready" || status === "error");

  function submit() {
    if (!canSend) return;
    const next = text.trim();
    setText("");
    onSend(next);
  }

  return (
    <div className="px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:px-6 sm:pb-4">
      <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-2 sm:gap-3">
        <form
          className="shell-input flex items-end gap-2 rounded-[1.6rem] border-2 border-indigo p-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="sr-only" htmlFor="bharat-message">
            {copy.placeholder}
          </label>
          <textarea
            id="bharat-message"
            rows={1}
            value={text}
            disabled={outOfMessages}
            placeholder={copy.placeholder}
            onChange={(event) => {
              setText(event.target.value);
              const field = event.target;
              field.style.height = "0px";
              field.style.height = `${Math.min(field.scrollHeight, 160)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                submit();
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
              {copy.send}
            </button>
          )}
        </form>
        {tooLong ? <p className="text-sm text-terracotta">{copy.tooLong}</p> : null}
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
