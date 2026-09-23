export type ChatRole = "user" | "assistant";

export interface ChatSource {
  source: string;
  type: string;
}

export interface ChatMessageData {
  id: string;
  role: ChatRole;
  content: string;
  sources?: ChatSource[];
}

function formatSourceLabel(source: string): string {
  const name = source.replace(/\.md$/, "").replace(/[-_]/g, " ");
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function ChatMessage({ role, content, sources }: ChatMessageData) {
  const isUser = role === "user";

  return (
    <div
      className={`flex w-full flex-col ${isUser ? "items-end" : "items-start"}`}
      role="listitem"
    >
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-6 whitespace-pre-wrap ${
          isUser ? "bg-accent text-background" : "border border-border bg-surface-2 text-foreground"
        }`}
      >
        {content}
      </div>

      {!isUser && sources && sources.length > 0 && (
        <div className="mt-1 flex max-w-[80%] flex-wrap items-center gap-1.5 px-1 text-xs text-muted">
          <span>Sources:</span>
          {sources.map((s) => (
            <span
              key={s.source}
              className="rounded-full border border-border bg-surface-2 px-2 py-0.5"
            >
              📄 {formatSourceLabel(s.source)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
