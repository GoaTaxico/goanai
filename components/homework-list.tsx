"use client";

import { useState } from "react";

import type { Copy } from "@/lib/copy";
import { addHomework, removeHomework, toggleHomework, useHomework } from "@/lib/homework";

export function HomeworkList({ copy }: { copy: Copy }) {
  const items = useHomework();
  const [text, setText] = useState("");

  return (
    <div>
      <form
        className="mb-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          addHomework(text);
          setText("");
        }}
      >
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={copy.homeworkPlaceholder}
          className="min-w-0 flex-1 rounded-full border border-line bg-white px-3 py-2 text-sm text-indigo outline-none"
        />
        <button type="submit" className="rounded-full bg-peacock px-4 py-2 text-sm font-semibold text-[#f7f3ea]">
          {copy.homeworkAdd}
        </button>
      </form>
      {items.length === 0 ? (
        <p className="text-sm leading-6 text-muted">{copy.emptyHomework}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2">
              <button
                type="button"
                aria-pressed={item.done}
                aria-label={copy.homeworkDone}
                onClick={() => toggleHomework(item.id)}
                className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs ${
                  item.done ? "border-peacock bg-peacock text-[#f7f3ea]" : "border-line text-transparent"
                }`}
              >
                ✓
              </button>
              <p className={`min-w-0 flex-1 text-sm leading-6 ${item.done ? "text-muted line-through" : ""}`}>{item.text}</p>
              <button
                type="button"
                aria-label={copy.homeworkDelete}
                onClick={() => removeHomework(item.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-terracotta"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
