"use client";

import * as React from "react";

type ChatBoxProps = {
  messages: string[];
  onSend: (message: string) => void;
};

export function ChatBox({ messages, onSend }: ChatBoxProps) {
  const [input, setInput] = React.useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = input.trim();
    if (!value) return;
    onSend(value);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-4 py-3 border-b">
        <h2 className="text-sm font-medium">Chat</h2>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <div className="text-sm text-zinc-500">Say hello to start…</div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className="rounded-md bg-zinc-100 p-2 text-sm dark:bg-zinc-900"
            >
              {m}
            </div>
          ))
        )}
      </div>
      <form onSubmit={handleSubmit} className="p-3 border-t">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe changes…"
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-800"
        />
      </form>
    </div>
  );
}

export default ChatBox;

