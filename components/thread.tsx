"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type FileUIPart, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

import { Composer } from "@/components/composer";
import { MarkdownMessage } from "@/components/markdown-message";
import { Mark, TideLine } from "@/components/mark";
import type { Copy, Lang } from "@/lib/copy";
import { drawPicture } from "@/lib/draw";
import { ERROR_LIMIT, ERROR_UNAVAILABLE, MAX_MESSAGE_CHARS } from "@/lib/limits";
import { shuffleStarterPrompts, useStarterPrompts } from "@/lib/prompts";

type ThreadProps = {
  chatId: string;
  initialMessages: UIMessage[];
  copy: Copy;
  lang: Lang;
  remaining: number | null;
  onMessages: (chatId: string, messages: UIMessage[]) => void;
  onSettled: () => void;
};

function messageText(message: UIMessage) {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

function messageImages(message: UIMessage) {
  return message.parts.filter(
    (part): part is FileUIPart =>
      part.type === "file" &&
      part.mediaType.startsWith("image/") &&
      (part.url.startsWith("data:image/jpeg;base64,") || part.url.startsWith("https://")),
  );
}

function plainText(text: string) {
  return text.replace(/[`*_#>]/g, "").trim();
}

export function Thread({
  chatId,
  initialMessages,
  copy,
  lang,
  remaining,
  onMessages,
  onSettled,
}: ThreadProps) {
  const endRef = useRef<HTMLDivElement>(null);
  const drawAbort = useRef<AbortController | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [followUps, setFollowUps] = useState<string[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [drawError, setDrawError] = useState<string | null>(null);

  const { messages, sendMessage, setMessages, regenerate, status, stop, error, clearError } = useChat({
    id: chatId,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  useEffect(() => {
    onMessages(chatId, messages);
  }, [chatId, messages, onMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status, error, followUps, drawing, drawError]);

  useEffect(() => {
    if (status === "ready" || status === "error") onSettled();
  }, [status, messages.length, onSettled]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      drawAbort.current?.abort();
    };
  }, []);

  const last = messages.at(-1);
  const lastId = last?.id;
  const lastRole = last?.role;
  const answer = lastRole === "assistant" && last ? messageText(last) : "";
  const lastHasImage = last ? messageImages(last).length > 0 : false;
  const previousQuestion = [...messages].reverse().find((message) => message.role === "user");
  const question = previousQuestion ? messageText(previousQuestion) : "";

  useEffect(() => {
    if (status !== "ready" || !lastId || !answer || !question || lastHasImage) return;

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
  }, [status, lastId, answer, question, lastHasImage]);

  const starters = useStarterPrompts(lang);
  const limitReached = error?.message.includes(ERROR_LIMIT) ?? false;
  const unavailable = error?.message.includes(ERROR_UNAVAILABLE) ?? false;
  const outOfMessages = limitReached || remaining === 0;
  const busy = status === "submitted" || status === "streaming" || drawing;
  const waiting = (status === "submitted" || status === "streaming") && !answer;
  const lastAssistant = [...messages].reverse().find((message) => message.role === "assistant");
  const lastAssistantId = lastAssistant?.id;
  const canRewrite =
    Boolean(lastAssistant && messageText(lastAssistant) && messageImages(lastAssistant).length === 0) &&
    !busy &&
    !outOfMessages;

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

  function toggleSpeak(id: string, text: string) {
    if (typeof window.speechSynthesis === "undefined") return;
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000));
    utterance.lang = lang === "hi" ? "hi-IN" : "en-IN";
    utterance.onend = () => setSpeakingId((current) => (current === id ? null : current));
    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  }

  async function requestPicture(prompt: string) {
    drawAbort.current?.abort();
    const controller = new AbortController();
    drawAbort.current = controller;
    setDrawing(true);
    setDrawError(null);
    setFollowUps([]);
    try {
      const drawn = await drawPicture(prompt, controller.signal);
      if (!drawn.ok) {
        setDrawError(
          drawn.error === "image_limit"
            ? copy.imageLimit
            : drawn.error === "unavailable"
              ? copy.unavailable
              : copy.drawFailed,
        );
        return false;
      }
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "user",
          parts: [{ type: "text", text: prompt }],
        },
        {
          id: crypto.randomUUID(),
          role: "assistant",
          parts: [
            { type: "file", mediaType: "image/png", url: drawn.url },
            { type: "text", text: copy.drawReady },
          ],
        },
      ]);
      return true;
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return false;
      setDrawError(copy.drawFailed);
      return false;
    } finally {
      if (drawAbort.current === controller) setDrawing(false);
    }
  }

  async function send(message: { text: string; image?: FileUIPart | null; draw: boolean }) {
    if (message.draw) return requestPicture(message.text);
    clearError();
    setDrawError(null);
    setFollowUps([]);
    const text = message.text.trim() || (message.image ? copy.lookPrompt : "");
    if (!text) return false;
    void sendMessage(message.image ? { text, files: [message.image] } : { text });
    return true;
  }

  function askAgain(text: string) {
    clearError();
    setFollowUps([]);
    void sendMessage({ text });
  }

  return (
    <div className="balcao flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <div className="balcao-arch" aria-hidden="true" />
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-3 sm:px-8 sm:py-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 ? (
            <div className="px-1 py-2 sm:py-8">
              <div className="rise mx-auto flex max-w-lg flex-col items-center text-center">
                <Mark className="mark-float h-12 w-12 sm:h-16 sm:w-16" />
                <div className="hidden sm:block">
                  <TideLine />
                </div>
                <h1 className="brand-name brand-name-ink font-display mt-2 text-5xl leading-none tracking-wide sm:text-7xl">
                  {copy.brand}
                </h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-indigo sm:text-base">{copy.mood}</p>
                <p className="font-display mt-2 max-w-full px-2 text-lg leading-tight text-indigo sm:text-2xl">
                  {copy.emptyTitle}
                </p>
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
                    onClick={() => void send({ text: suggestion, draw: false })}
                    className={`tile-card rise overflow-hidden rounded-3xl text-left disabled:opacity-50 ${
                      index === 1 ? "delay-1" : index === 2 ? "delay-2" : ""
                    }`}
                  >
                    <span className="kaavi-line" />
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
              const images = messageImages(message);
              if (!text && images.length === 0 && message.role !== "assistant") return null;
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
                      className={`max-w-[90%] min-w-0 overflow-hidden px-4 py-3 text-sm leading-6 break-words ${
                        mine
                          ? "rounded-[1.4rem] rounded-br-md bg-indigo text-[#f7f3ea] shadow-[0_10px_24px_rgba(8,52,60,0.12)]"
                          : "kaavi-reply rounded-[1.4rem] rounded-bl-md border border-line bg-paper text-foreground shadow-[0_10px_24px_rgba(8,52,60,0.06)]"
                      }`}
                    >
                      {mine ? null : <span className="kaavi-line -mx-4 -mt-3 mb-3" />}
                      {images.map((image) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={image.url} src={image.url} alt="" className="mb-2 max-h-72 w-full rounded-xl object-cover" />
                      ))}
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
                    <div className={`flex flex-wrap gap-x-3 gap-y-1 px-2 text-xs text-muted ${mine ? "justify-end" : ""}`}>
                      <button type="button" onClick={() => void copyText(message.id, text)}>
                        {copiedId === message.id ? copy.copied : copy.copy}
                      </button>
                      {mine && images.length === 0 && !busy && !outOfMessages ? (
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
                      {!mine ? (
                        <button type="button" onClick={() => void copyText(`${message.id}-wa`, plainText(text))}>
                          {copiedId === `${message.id}-wa` ? copy.copied : copy.whatsapp}
                        </button>
                      ) : null}
                      {!mine ? (
                        <button type="button" onClick={() => toggleSpeak(message.id, plainText(text))}>
                          {speakingId === message.id ? copy.listenStop : copy.listen}
                        </button>
                      ) : null}
                      {!mine && message.id === lastAssistantId && images.length === 0 && !busy && !outOfMessages ? (
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
          {canRewrite ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => askAgain(copy.shorterPrompt)}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-indigo"
              >
                {copy.shorter}
              </button>
              <button
                type="button"
                onClick={() => askAgain(copy.translatePrompt)}
                className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-semibold text-indigo"
              >
                {copy.otherLanguage}
              </button>
            </div>
          ) : null}
          {status === "ready" && followUps.length > 0 && !outOfMessages ? (
            <div className="rise">
              <p className="px-1 text-xs font-medium text-muted">{copy.followLabel}</p>
              <div className="mt-2 flex flex-col gap-2">
                {followUps.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => void send({ text: item, draw: false })}
                    className="rounded-2xl border border-line bg-paper px-4 py-3 text-left text-sm transition hover:-translate-y-0.5 hover:border-peacock"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {waiting || drawing ? (
            <p className="flex items-center gap-2 text-sm text-peacock" aria-live="polite">
              <span className="tide-dots" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              {drawing ? copy.drawing : copy.thinking}
            </p>
          ) : null}
          {drawError ? (
            <div className="rounded-3xl border border-terracotta/40 bg-[#f8e4dc] px-4 py-3">
              <p className="text-sm font-semibold text-terracotta">{drawError}</p>
            </div>
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
        status={status}
        extraBusy={drawing}
        limitReached={limitReached}
        remaining={remaining}
        onStop={() => {
          if (drawing) drawAbort.current?.abort();
          else void stop();
        }}
        onSend={send}
      />
    </div>
  );
}
