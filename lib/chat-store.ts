"use client";

import { useSyncExternalStore } from "react";
import type { UIMessage } from "ai";

import type { Lang } from "@/lib/copy";
import {
  createChat,
  loadChats,
  loadLang,
  saveChats,
  saveLang,
  titleFromMessages,
  type StoredChat,
} from "@/lib/storage";

type BharatState = {
  chats: StoredChat[];
  activeId: string;
  lang: Lang;
};

const serverState: BharatState = {
  chats: [],
  activeId: "",
  lang: "en",
};

let clientState: BharatState | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readClientState() {
  if (!clientState) {
    const stored = loadChats();
    const chats = stored.length > 0 ? stored : [createChat()];
    clientState = {
      chats,
      activeId: chats[0].id,
      lang: loadLang(),
    };
  }

  return clientState;
}

function commit(next: BharatState) {
  clientState = next;
  saveChats(next.chats);
  saveLang(next.lang);
  emit();
}

export function useBharatState() {
  return useSyncExternalStore(subscribe, readClientState, () => serverState);
}

export function updateMessages(id: string, messages: UIMessage[]) {
  const current = readClientState();
  const chat = current.chats.find((item) => item.id === id);
  if (!chat || chat.messages === messages) return;

  const title = titleFromMessages(messages);
  commit({
    ...current,
    chats: current.chats.map((item) =>
      item.id === id
        ? {
            ...item,
            messages,
            title: title || item.title,
            updatedAt: Date.now(),
          }
        : item,
    ),
  });
}

export function startChat() {
  const current = readClientState();
  const chat = createChat();
  commit({
    ...current,
    chats: [chat, ...current.chats],
    activeId: chat.id,
  });
}

export function selectChat(id: string) {
  const current = readClientState();
  if (current.activeId === id) return;
  commit({ ...current, activeId: id });
}

export function removeChat(id: string) {
  const current = readClientState();
  const remaining = current.chats.filter((chat) => chat.id !== id);
  const chats = remaining.length > 0 ? remaining : [createChat()];
  commit({
    ...current,
    chats,
    activeId: current.activeId === id ? chats[0].id : current.activeId,
  });
}

export function setLanguage(lang: Lang) {
  const current = readClientState();
  if (current.lang === lang) return;
  commit({ ...current, lang });
}
