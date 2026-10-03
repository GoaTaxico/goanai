import type { UIMessage } from "ai";

import { visibleMessage } from "@/lib/quiz";

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

function keptPart(part: UIMessage["parts"][number]) {
  if (part.type !== "file") return true;
  const url = "url" in part && typeof part.url === "string" ? part.url : "";
  return url.startsWith("data:image/jpeg;base64,") || url.startsWith("/images/");
}

export function loadChats() {
  const raw = read(CHATS_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const chats = parsed.filter(isStoredChat).map((chat) => ({
      ...chat,
      messages: chat.messages.map((message) => ({
        ...message,
        parts: message.parts.filter(keptPart),
      })),
    }));
    if (JSON.stringify(chats) !== JSON.stringify(parsed.filter(isStoredChat))) {
      saveChats(chats);
    }
    return chats;
  } catch {
    return [];
  }
}

export function saveChats(chats: StoredChat[]) {
  write(CHATS_KEY, JSON.stringify(chats));
}

export function loadLang(): Lang {
  const saved = read(LANG_KEY);
  if (saved === "hi" || saved === "kok" || saved === "mr") return saved;
  return "en";
}

export function saveLang(lang: Lang) {
  write(LANG_KEY, lang);
}

export function titleFromMessages(messages: UIMessage[]) {
  const firstUser = messages.find((message) => message.role === "user");
  const text = visibleMessage(firstUser?.parts.find((part) => part.type === "text")?.text ?? "");
  return text.replace(/\s+/g, " ").slice(0, 42);
}
