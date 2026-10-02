"use client";

import { useCallback, useEffect, useState } from "react";

import { InstallButton } from "@/components/install-button";
import { Mark } from "@/components/mark";
import { Sidebar } from "@/components/sidebar";
import { Thread } from "@/components/thread";
import {
  removeChat,
  selectChat,
  setLanguage,
  startChat,
  updateMessages,
  useBharatState,
} from "@/lib/chat-store";
import { copy } from "@/lib/copy";

export function ChatApp() {
  const state = useBharatState();
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
    document.documentElement.lang = state.lang === "hi" ? "hi" : "en";
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
  const ordered = [...state.chats].sort((a, b) => b.updatedAt - a.updatedAt);
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
        onLanguage={() => setLanguage(state.lang === "en" ? "hi" : "en")}
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
        />
      </div>
    </div>
  );
}
