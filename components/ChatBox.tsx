"use client";

import { useRef, useState, useEffect } from "react";
import { ChatMessage, type ChatMessageData, type ChatSource } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestedQuestions } from "./SuggestedQuestions";

function createId() {
  return Math.random().toString(36).slice(2);
}

interface ChatBoxProps {
  embed?: boolean;
}

export function ChatBox({ embed = false }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (content: string) => {
    setError(null);
    const userMessage: ChatMessageData = { id: createId(), role: "user", content };
    const history = messages.map(({ role, content: c }) => ({ role, content: c }));
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, history }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      let sources: ChatSource[] = [];
      const rawSources = res.headers.get("X-Sources");
      if (rawSources) {
        try {
          sources = JSON.parse(decodeURIComponent(rawSources));
        } catch {
          sources = [];
        }
      }

      const assistantId = createId();
      let firstChunk = true;

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response received.");

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        if (!text) continue;

        if (firstChunk) {
          firstChunk = false;
          setIsLoading(false);
          setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: text, sources }]);
        } else {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m))
          );
        }
      }

      if (firstChunk) {
        // Stream closed without producing any content.
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "I don't have a response for that.", sources },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={
        embed
          ? "flex h-full w-full flex-col overflow-hidden bg-background"
          : "flex h-[600px] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_8px_30px_-12px_rgb(0_0_0/0.6)]"
      }
    >
      <header className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Amirul&lsquo;s Chat Assistant</h2>
      </header>

      <div
        ref={scrollRef}
        role="list"
        aria-live="polite"
        className="flex flex-1 flex-col gap-3 overflow-y-auto p-4"
      >
        {messages.length === 0 && !isLoading && (
          <div className="m-auto flex flex-col items-center gap-4">
            <p className="max-w-xs text-center text-sm text-muted">
              Ask me about Amirul&apos;s projects, skills, experience, or education.
            </p>
            <SuggestedQuestions onSelect={sendMessage} />
          </div>
        )}

        {messages.map((message) => (
          <ChatMessage key={message.id} {...message} />
        ))}

        {isLoading && (
          <div className="flex w-full justify-start" role="listitem" aria-label="Assistant is typing">
            <div className="flex items-center gap-1 rounded-2xl bg-surface-2 px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="border-t border-border bg-warn/10 px-4 py-2 text-sm text-warn">
          {error}
        </p>
      )}

      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
