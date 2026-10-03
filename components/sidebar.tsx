import { useState } from "react";

import { InstallButton } from "@/components/install-button";
import { Mark } from "@/components/mark";
import type { Copy } from "@/lib/copy";
import type { StoredChat } from "@/lib/storage";

type SidebarProps = {
  copy: Copy;
  chats: StoredChat[];
  activeId: string;
  open: boolean;
  onClose: () => void;
  onNew: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onPin: (id: string) => void;
  onLanguage: () => void;
  remaining: number | null;
};

export function Sidebar({
  copy,
  chats,
  activeId,
  open,
  onClose,
  onNew,
  onSelect,
  onDelete,
  onRename,
  onPin,
  onLanguage,
  remaining,
}: SidebarProps) {
  const [query, setQuery] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const needle = query.trim().toLowerCase();
  const visible = needle
    ? chats.filter((chat) => (chat.title || copy.untitled).toLowerCase().includes(needle))
    : chats;

  return (
    <>
      {open ? (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label={copy.close}
          onClick={onClose}
        />
      ) : null}
      <aside
        className={`app-drawer shore flex-col text-[#f7f3ea] shadow-[8px_0_30px_rgba(8,52,60,0.22)] ${
          open ? "is-open" : ""
        }`}
      >
        <div className="tide-bar shrink-0" />
        <div className="flex items-center gap-3 px-4 pb-2 pt-5 sm:px-5 sm:pt-6">
          <span className="mark-float grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#f4ecdf] shadow-[0_0_0_3px_rgba(242,193,78,0.45)] sm:h-14 sm:w-14">
            <Mark className="h-10 w-10 sm:h-12 sm:w-12" />
          </span>
          <p className="brand-name min-w-0 flex-1 font-display text-2xl leading-none tracking-wide sm:text-3xl">{copy.brand}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={copy.close}
            className="drawer-close grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#f2c98a]/50 text-lg"
          >
            ×
          </button>
        </div>
        <p className="px-5 pb-4 text-xs leading-5 text-[#c9ddd8]">{copy.tagline}</p>
        <div className="px-4">
          <button
            type="button"
            onClick={onNew}
            className="sunset-btn w-full rounded-full px-3 py-2.5 text-sm font-semibold hover:translate-y-0.5 hover:shadow-[0_5px_0_#8d4d16]"
          >
            {copy.newChat}
          </button>
        </div>
        <p className="px-5 pb-2 pt-6 text-xs font-semibold tracking-[0.18em] text-[#f2c98a]">
          {copy.chats}
        </p>
        <div className="px-4 pb-3">
          <label className="sr-only" htmlFor="chat-search">
            {copy.searchChats}
          </label>
          <input
            id="chat-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={copy.searchChats}
            className="w-full rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm text-[#f7f3ea] outline-none placeholder:text-[#c9ddd8]"
          />
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {visible.map((chat) => {
            const selected = chat.id === activeId;
            const renaming = renamingId === chat.id;
            return (
              <div
                key={chat.id}
                className={`flex items-center rounded-2xl ${
                  selected ? "bg-[#fffaf3] text-indigo" : "hover:bg-white/10"
                }`}
              >
                {renaming ? (
                  <form
                    className="min-w-0 flex-1 px-2 py-1.5"
                    onSubmit={(event) => {
                      event.preventDefault();
                      onRename(chat.id, draft);
                      setRenamingId(null);
                    }}
                  >
                    <input
                      value={draft}
                      autoFocus
                      onChange={(event) => setDraft(event.target.value)}
                      onBlur={() => {
                        onRename(chat.id, draft);
                        setRenamingId(null);
                      }}
                      className="w-full rounded-xl bg-white px-2 py-1 text-sm text-indigo outline-none"
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => onSelect(chat.id)}
                    className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm"
                  >
                    {chat.pinned ? "★ " : ""}
                    {chat.title || copy.untitled}
                  </button>
                )}
                <button
                  type="button"
                  aria-label={chat.pinned ? copy.unpin : copy.pin}
                  onClick={() => onPin(chat.id)}
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                    selected ? "text-indigo" : "text-[#f2c98a]"
                  }`}
                >
                  {chat.pinned ? "★" : "☆"}
                </button>
                <button
                  type="button"
                  aria-label={copy.rename}
                  onClick={() => {
                    setRenamingId(chat.id);
                    setDraft(chat.title);
                  }}
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs ${
                    selected ? "text-indigo" : "text-[#c9ddd8] hover:text-white"
                  }`}
                >
                  ✎
                </button>
                <button
                  type="button"
                  aria-label={copy.delete}
                  onClick={() => onDelete(chat.id)}
                  className={`mr-2 grid h-7 w-7 place-items-center rounded-full text-sm ${
                    selected
                      ? "bg-terracotta text-white"
                      : "text-[#c9ddd8] hover:bg-white/10 hover:text-white"
                  }`}
                >
                  ×
                </button>
              </div>
            );
          })}
        </nav>
        <div className="space-y-3 border-t border-white/10 p-4">
          {remaining != null ? (
            <p className="text-sm font-semibold text-[#f7f3ea]">
              {copy.remaining.replace("{count}", String(remaining))}
            </p>
          ) : null}
          <p className="text-xs leading-5 text-[#c9ddd8]">{copy.footer}</p>
          <InstallButton copy={copy} />
          <button
            type="button"
            onClick={onLanguage}
            className="w-full rounded-full border border-[#f2c98a]/50 px-3 py-2 text-sm text-[#f7f3ea] hover:bg-white/10"
          >
            {copy.language}
          </button>
        </div>
      </aside>
    </>
  );
}
