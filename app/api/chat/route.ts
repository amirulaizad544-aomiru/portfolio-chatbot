import { streamAnswer, type ConversationMessage } from "@/lib/rag";

export const runtime = "nodejs";
// Keep in sync with REQUEST_TIMEOUT_MS below, so our own graceful timeout
// error fires before the platform kills the function outright. Check your
// Vercel plan supports this duration for serverless functions.
export const maxDuration = 60;

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY_ITEMS = 20;
const REQUEST_TIMEOUT_MS = 60_000;

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function parseHistory(value: unknown): ConversationMessage[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_HISTORY_ITEMS) return null;

  const history: ConversationMessage[] = [];

  for (const item of value) {
    if (typeof item !== "object" || item === null) return null;

    const { role, content } = item as { role?: unknown; content?: unknown };
    const hasValidRole = role === "user" || role === "assistant";
    const hasValidContent = typeof content === "string" && content.length <= MAX_MESSAGE_LENGTH;

    if (!hasValidRole || !hasValidContent) return null;

    history.push({ role, content } as ConversationMessage);
  }

  return history;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const message = (body as { message?: unknown } | null)?.message;

  if (typeof message !== "string" || message.trim().length === 0) {
    return jsonError("'message' is required and must be a non-empty string.", 400);
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return jsonError(`'message' must be ${MAX_MESSAGE_LENGTH} characters or fewer.`, 400);
  }

  const history = parseHistory((body as { history?: unknown } | null)?.history);

  if (history === null) {
    return jsonError(`'history' must be an array of at most ${MAX_HISTORY_ITEMS} { role, content } messages.`, 400);
  }

  if (!process.env.GROQ_API_KEY) {
    console.error("GROQ_API_KEY is not configured.");
    return jsonError("Chat service is not configured.", 500);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const { sources, stream } = await streamAnswer(message, history, controller.signal);

    const encoder = new TextEncoder();
    const responseBody = new ReadableStream<Uint8Array>({
      async start(streamController) {
        try {
          for await (const chunk of stream) {
            streamController.enqueue(encoder.encode(chunk));
          }
        } catch (error) {
          console.error("Streaming failed:", error);
        } finally {
          clearTimeout(timeout);
          streamController.close();
        }
      },
      cancel() {
        controller.abort();
      },
    });

    return new Response(responseBody, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Sources": encodeURIComponent(JSON.stringify(sources)),
      },
    });
  } catch (error) {
    clearTimeout(timeout);

    const status = (error as { status?: number } | null)?.status;
    if (status === 429) {
      console.error("Chat model rate limit hit:", error);
      return jsonError("The chat service is rate-limited right now. Please try again shortly.", 429);
    }

    if (controller.signal.aborted) {
      console.error("Chat request timed out.");
      return jsonError("The chat service took too long to respond.", 504);
    }

    console.error("Chat request failed:", error);
    return jsonError("Failed to generate a response.", 502);
  }
}
