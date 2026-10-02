"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

import { Composer } from "@/components/composer";
import { MarkdownMessage } from "@/components/markdown-message";
import { Mark, TideLine } from "@/components/mark";
import type { ModelSlug, PublicModel } from "@/lib/catalog";
import type { Copy, Lang } from "@/lib/copy";
import { shuffleStarterPrompts, useStarterPrompts } from "@/lib/prompts";
import { ERROR_LIMIT, ERROR_UNAVAILABLE, MAX_MESSAGE_CHARS } from "@/lib/limits";

type ThreadProps = {
  chatId: string;
  initialMessages: UIMessage[];
  model: ModelSlug;
  copy: Copy;
  lang: Lang;
  models?: PublicModel[];
  remaining: number | null;
  onMessages: (chatId: string, messages: UIMessage[]) => void;
  onModel: (model: ModelSlug) => void;
  onSettled: () => void;
};

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

export function Thread({
  chatId,
  initialMessages,
  model,
  copy,
  lang,
  models,
  remaining,
  onMessages,
  onModel,
  onSettled,
}: ThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);

  const { messages, sendMessage, regenerate, status, stop, error, clearError } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { model },
    }),
  });

  useEffect(() => {
    onMessages(chatId, messages);
  }, [chatId, messages, onMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status, error, followUps]);

  useEffect(() => {
    if (status === "ready" || status === "error") onSettled();
  }, [status, messages.length, onSettled]);

  const last = messages.at(-1);
  const lastId = last?.id;
  const lastRole = last?.role;
  const answer = lastRole === "assistant" && last ? messageText(last) : "";
  const previousQuestion = [...messages].reverse().find((message) => message.role === "user");
  const question = previousQuestion ? messageText(previousQuestion) : "";

  useEffect(() => {
    if (status !== "ready" || !lastId || !answer || !question) return;

    let cancelled = false;
    fetch("/api/suggestions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, answer }),
    })
      .then((response) => response.json())
      .then((data: { suggestions?: string[] }) => {
        if (!cancelled) setFollowUps(data.suggestions ?? []);
      })
      .catch(() => {
        if (!cancelled) setFollowUps([]);
      });

    return () => {
      cancelled = true;
    };
  }, [status, lastId, answer, question]);

  const starters = useStarterPrompts(lang);
  const limitReached = error?.message.includes(ERROR_LIMIT) ?? false;
  const unavailable = error?.message.includes(ERROR_UNAVAILABLE) ?? false;
  const outOfMessages = limitReached || remaining === 0;
  const busy = status === "submitted" || status === "streaming";
  const waiting = busy && lastRole !== "assistant";
  const lastAssistantId = [...messages].reverse().find((message) => message.role === "assistant")?.id;

  async function copyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === id ? null : current));
      }, 1500);
    } catch {
      // The message stays on screen if the browser blocks the clipboard.
    }
  }

  function send(text: string) {
    clearError();
    setFollowUps([]);
    void sendMessage({ text });
  }

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-8 sm:py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 ? (
            <div className="px-1 py-1 sm:py-12">
              <div className="rise mx-auto flex max-w-lg flex-col items-center text-center">
                <Mark className="mark-float h-14 w-14 sm:h-20 sm:w-20" />
                <div className="hidden sm:block">
                  <TideLine />
                </div>
                <p className="brand-name brand-name-ink mt-2 font-display text-xl tracking-wide sm:text-2xl">{copy.brand}</p>
                <h1 className="font-display mt-1 max-w-full px-2 text-2xl leading-tight text-balance text-indigo sm:mt-2 sm:px-4 sm:text-5xl">
                  {copy.emptyTitle}
                </h1>
                <p className="mt-3 max-w-sm text-sm text-muted">{copy.tagline}</p>
                <p className="mt-4 max-w-sm text-sm font-medium text-indigo">{copy.about}</p>
                <p className="mt-1 max-w-sm text-sm text-muted">
                  {copy.creditBefore}
                  <a
                    href="https://coastalcode.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-peacock underline underline-offset-2"
                  >
                    {copy.creditName}
                  </a>
                  {copy.creditAfter}
                </p>
              </div>
              <div key={starters.join("|")} className="starter-grid mx-auto mt-4 grid w-full max-w-3xl gap-2 sm:mt-8">
                {starters.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={outOfMessages}
                    onClick={() => send(suggestion)}
                    className={`tile-card rise overflow-hidden rounded-3xl text-left disabled:opacity-50 ${
                      index === 1 ? "delay-1" : index === 2 ? "delay-2" : ""
                    }`}
                  >
                    <span
                      className={`block h-1.5 ${
                        index === 0 ? "bg-marigold" : index === 1 ? "bg-peacock" : "bg-terracotta"
                      }`}
                    />
                    <span className="block px-4 py-4 text-sm leading-6">{suggestion}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={shuffleStarterPrompts}
                  className="rounded-full border border-peacock/40 bg-paper px-4 py-2 text-sm font-semibold text-indigo shadow-[0_8px_20px_rgba(8,52,60,0.08)] transition hover:-translate-y-0.5"
                >
                  {copy.moreIdeas}
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const text = messageText(message);
              if (!text && message.role !== "assistant") return null;
              const mine = message.role === "user";
              const editing = editingId === message.id;

              return (
                <article
                  key={message.id}
                  className={`rise flex w-full min-w-0 flex-col gap-1 ${mine ? "items-end" : "items-start"}`}
                >
                  <p className="px-2 text-xs font-medium text-muted">
                    {mine ? copy.you : copy.brand}
                  </p>
                  {editing ? (
                    <form
                      className="w-full max-w-[90%]"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const next = draft.trim();
                        if (!next || next.length > MAX_MESSAGE_CHARS || outOfMessages || busy) return;
                        setEditingId(null);
                        clearError();
                        void sendMessage({ text: next, messageId: message.id });
                      }}
                    >
                      <textarea
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        className="min-h-24 w-full rounded-2xl border-2 border-indigo bg-paper px-3 py-2 text-sm outline-none"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded-full px-3 py-1.5 text-xs text-muted"
                        >
                          {copy.cancel}
                        </button>
                        <button
                          type="submit"
                          className="rounded-full bg-indigo px-3 py-1.5 text-xs font-semibold text-[#f7f1e6]"
                        >
                          {copy.save}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div
                      className={`max-w-[90%] min-w-0 px-4 py-3 text-sm leading-6 break-words ${
                        mine
                          ? "rounded-[1.4rem] rounded-br-md bg-indigo text-[#f7f3ea] shadow-[0_10px_24px_rgba(8,52,60,0.12)]"
                          : "rounded-[1.4rem] rounded-bl-md border border-line border-l-4 border-l-marigold bg-paper text-foreground shadow-[0_10px_24px_rgba(8,52,60,0.06)]"
                      }`}
                    >
                      {mine ? (
                        <p className="whitespace-pre-wrap">{text}</p>
                      ) : text ? (
                        <MarkdownMessage text={text} />
                      ) : (
                        <p className="text-muted">{copy.thinking}</p>
                      )}
                    </div>
                  )}
                  {text && !editing ? (
                    <div className={`flex gap-3 px-2 text-xs text-muted ${mine ? "justify-end" : ""}`}>
                      <button type="button" onClick={() => void copyText(message.id, text)}>
                        {copiedId === message.id ? copy.copied : copy.copy}
                      </button>
                      {mine && !busy && !outOfMessages ? (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(message.id);
                            setDraft(text);
                          }}
                        >
                          {copy.edit}
                        </button>
                      ) : null}
                      {!mine && message.id === lastAssistantId && !busy && !outOfMessages ? (
                        <button
                          type="button"
                          onClick={() => {
                            clearError();
                            setFollowUps([]);
                            void regenerate();
                          }}
                        >
                          {copy.regenerate}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
          {status === "ready" && followUps.length > 0 && !outOfMessages ? (
            <div className="rise">
              <p className="px-1 text-xs font-medium text-muted">{copy.followLabel}</p>
              <div className="mt-2 flex flex-col gap-2">
                {followUps.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => send(item)}
                    className="rounded-2xl border border-line bg-paper px-4 py-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-peacock"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {waiting ? (
            <p className="flex items-center gap-2 text-sm text-peacock" aria-live="polite">
              <span className="tide-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {copy.thinking}
            </p>
          ) : null}
          {error ? (
            <div className="rounded-3xl border border-terracotta/40 bg-[#f8e4dc] px-4 py-3">
              <p className="text-sm font-semibold text-terracotta">
                {limitReached ? copy.limitTitle : unavailable ? copy.unavailable : copy.busy}
              </p>
              {limitReached ? (
                <p className="mt-1 text-sm text-muted">{copy.limitBody}</p>
              ) : null}
            </div>
          ) : null}
          <div ref={endRef} />
        </div>
      </div>
      <Composer
        copy={copy}
        lang={lang}
        model={model}
        status={status}
        limitReached={limitReached}
        remaining={remaining}
        models={models}
        onModel={onModel}
        onStop={() => {
          void stop();
        }}
        onSend={send}
      />
    </div>
  );
}
