import type { UIMessage } from "ai";

import type { Lang } from "@/lib/copy";

export type StoredChat = {
  id: string;
  title: string;
  model: string;
  messages: UIMessage[];
  updatedAt: number;
  pinned?: boolean;
  titleLocked?: boolean;
};

const CHATS_KEY = "bharat-ai-chats";
const LANG_KEY = "bharat-ai-lang";

function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private browsing can block storage. The chat still works for this visit.
  }
}

export function createChat(): StoredChat {
  return {
    id: crypto.randomUUID(),
    title: "",
    model: "chat",
    messages: [],
    updatedAt: Date.now(),
  };
}

function isStoredChat(value: unknown): value is StoredChat {
  if (!value || typeof value !== "object") return false;
  const chat = value as Partial<StoredChat>;
  return (
    typeof chat.id === "string" &&
    typeof chat.title === "string" &&
    typeof chat.model === "string" &&
    Array.isArray(chat.messages) &&
    typeof chat.updatedAt === "number"
  );
}

export function loadChats() {
  const raw = read(CHATS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredChat);
  } catch {
    return [];
  }
}

export function saveChats(chats: StoredChat[]) {
  write(CHATS_KEY, JSON.stringify(chats));
}

export function loadLang(): Lang {
  return read(LANG_KEY) === "hi" ? "hi" : "en";
}

export function saveLang(lang: Lang) {
  write(LANG_KEY, lang);
}

export function titleFromMessages(messages: UIMessage[]) {
  const firstUser = messages.find((message) => message.role === "user");
  const text = firstUser?.parts.find((part) => part.type === "text")?.text ?? "";
  return text.trim().replace(/\s+/g, " ").slice(0, 42);
}
