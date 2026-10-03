"use client";

import { useCallback, useEffect, useState } from "react";

import { InstallButton } from "@/components/install-button";
import { Mark } from "@/components/mark";
import { Sidebar } from "@/components/sidebar";
import { Thread } from "@/components/thread";
import {
  removeChat,
  renameChat,
  selectChat,
  setLanguage,
  startChat,
  togglePin,
  updateMessages,
  useBharatState,
} from "@/lib/chat-store";
import { copy, type Lang } from "@/lib/copy";
import { type MissedQuestion, removeMiss, useMissed } from "@/lib/missed";
import { removeNote, useNotes } from "@/lib/notes";
import { readableMessage } from "@/lib/quiz";

function nextLanguage(lang: Lang): Lang {
  if (lang === "en") return "hi";
  if (lang === "hi") return "kok";
  if (lang === "kok") return "mr";
  return "en";
}

function chatTranscript(title: string, messages: { role: string; parts: { type: string; text?: string }[] }[]) {
  const lines = messages.map((message) => {
    const text = message.parts
      .filter((part) => part.type === "text" && part.text)
      .map((part) => part.text)
      .join("");
    const readable = readableMessage(text);
    if (!readable.trim()) return "";
    return `${message.role === "user" ? "You" : "Susegad"}\n${readable.trim()}`;
  });
  return [`${title || "Susegad"}`, "", ...lines.filter(Boolean)].join("\n\n");
}

export function ChatApp() {
  const state = useBharatState();
  const notes = useNotes();
  const missed = useMissed();
  const [practice, setPractice] = useState<MissedQuestion | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const refreshUsage = useCallback(() => {
    fetch("/api/usage")
      .then((response) => response.json())
      .then((data: { remaining?: number }) => {
        if (typeof data.remaining === "number") setRemaining(data.remaining);
      })
      .catch(() => {
        // The count appears again on the next successful reply.
      });
  }, []);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  useEffect(() => {
    document.documentElement.lang =
      state.lang === "kok" ? "kok" : state.lang === "mr" ? "mr" : state.lang === "hi" ? "hi" : "en";
  }, [state.lang]);

  if (state.chats.length === 0) {
    return (
      <div className="coast-room grid h-dvh place-items-center text-indigo">
        <div className="rise flex flex-col items-center">
          <Mark className="mark-float h-20 w-20" />
          <p className="brand-name brand-name-ink font-display mt-4 text-4xl tracking-wide">{copy[state.lang].brand}</p>
        </div>
      </div>
    );
  }

  const text = copy[state.lang];
  const ordered = [...state.chats].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
  const active =
    state.chats.find((chat) => chat.id === state.activeId) ?? ordered[0];

  return (
    <div className="app-shell bg-background text-foreground">
      <Sidebar
        copy={text}
        chats={ordered}
        activeId={active.id}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNew={() => {
          startChat();
          setSidebarOpen(false);
        }}
        onSelect={(id) => {
          selectChat(id);
          setSidebarOpen(false);
        }}
        onDelete={removeChat}
        onRename={renameChat}
        onPin={togglePin}
        onLanguage={() => setLanguage(nextLanguage(state.lang))}
        onExport={() => {
          const body = chatTranscript(active.title, active.messages);
          const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
          const link = document.createElement("a");
          const name = (active.title || "susegad").replace(/[^\w\u0900-\u097F -]+/g, "").trim().slice(0, 40) || "susegad";
          link.href = URL.createObjectURL(blob);
          link.download = `${name}.txt`;
          link.click();
          URL.revokeObjectURL(link.href);
        }}
        notes={notes}
        onDeleteNote={removeNote}
        onShareNote={(text) => {
          window.open(`https://wa.me/?text=${encodeURIComponent(text.slice(0, 4000))}`, "_blank", "noopener,noreferrer");
        }}
        onPrintNote={(text) => {
          const page = window.open("", "_blank", "noopener,noreferrer");
          if (!page) return;
          page.document.title = "Susegad";
          page.document.body.style.fontFamily = "sans-serif";
          page.document.body.style.whiteSpace = "pre-wrap";
          page.document.body.textContent = text;
          page.print();
        }}
        missed={missed}
        onRetryMiss={(item) => {
          setPractice(item);
          setSidebarOpen(false);
        }}
        onDeleteMiss={removeMiss}
        remaining={remaining}
      />
      <div className="coast-room app-main flex min-h-0 min-w-0 flex-col overflow-hidden">
        <header className="phone-bar shore w-full items-center gap-2 px-3 py-2.5 text-[#f7f3ea]">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label={text.menu}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#f2c98a]/50"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
              <path d="M3 5h14M3 10h14M3 15h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <p className="brand-name font-display min-w-0 flex-1 truncate text-2xl leading-none tracking-wide">{text.brand}</p>
          <InstallButton copy={text} light />
        </header>
        <Thread
          key={active.id}
          chatId={active.id}
          initialMessages={active.messages}
          copy={text}
          lang={state.lang}
          onMessages={updateMessages}
          remaining={remaining}
          onSettled={refreshUsage}
          practice={practice}
          onPracticeDone={() => setPractice(null)}
        />
      </div>
    </div>
  );
}
