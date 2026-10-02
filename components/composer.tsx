"use client";

import { useState } from "react";
import type { ChatStatus } from "ai";

import { publicModels, type ModelSlug, type PublicModel } from "@/lib/catalog";
import type { Copy, Lang } from "@/lib/copy";
import { MAX_MESSAGE_CHARS } from "@/lib/limits";

const seal: Record<ModelSlug, string> = {
  swift: "border-marigold data-[on=true]:bg-marigold data-[on=true]:text-indigo",
  pro: "border-peacock data-[on=true]:bg-peacock data-[on=true]:text-[#f7f1e6]",
  reason: "border-terracotta data-[on=true]:bg-terracotta data-[on=true]:text-[#f7f1e6]",
};

type ComposerProps = {
  copy: Copy;
  lang: Lang;
  model: ModelSlug;
  status: ChatStatus;
  limitReached: boolean;
  models?: PublicModel[];
  remaining: number | null;
  onModel: (model: ModelSlug) => void;
  onSend: (text: string) => void;
  onStop: () => void;
};

export function Composer({
  copy,
  lang,
  model,
  status,
  limitReached,
  models = publicModels,
  remaining,
  onModel,
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
        <div className="grid w-full min-w-0 grid-cols-3 gap-2">
          {models.map((item) => {
            const selected = item.id === model;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                data-on={selected}
                disabled={outOfMessages}
                onClick={() => onModel(item.id)}
                className={`min-w-0 rounded-2xl border-2 bg-paper px-2 py-2 text-left transition hover:-translate-y-0.5 disabled:opacity-50 sm:px-3 ${seal[item.id]}`}
              >
                <span className="block text-xs font-semibold leading-4 sm:truncate sm:text-sm">{item.name}</span>
                <span
                  className={`mt-0.5 hidden text-[11px] leading-4 sm:line-clamp-2 sm:block sm:text-xs ${selected ? "opacity-80" : "text-muted"}`}
                >
                  {item.description[lang]}
                </span>
              </button>
            );
          })}
        </div>
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
              className="shrink-0 rounded-full bg-indigo px-4 py-2 text-sm font-semibold text-[#f7f3ea] transition hover:bg-peacock disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
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
