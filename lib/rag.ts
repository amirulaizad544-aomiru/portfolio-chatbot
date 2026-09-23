import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { AIMessage, HumanMessage, type BaseMessage } from "@langchain/core/messages";
import { IterableReadableStream } from "@langchain/core/utils/stream";
import { retrieveRelevantChunks, type RetrievedChunk } from "./retriever";

const GROQ_MODEL = "openai/gpt-oss-120b";
const MAX_HISTORY_MESSAGES = 10;

// RAG (long-term portfolio knowledge, retrieved fresh per question) is kept
// separate from conversation history (short-term turn-by-turn context) and
// combined only at prompt time.
const SYSTEM_PROMPT = `You are Amirul's portfolio assistant.

Answer the user's question using only the provided portfolio context and the conversation so far.

If the answer cannot be found in the context, say that the information is not available in your knowledge base. Do not guess.

Do not invent experience, projects, technologies, or qualifications. Do not speculate about future plans, salary, or other information that isn't in the context.

Write in plain text only. Do not use Markdown formatting (no **bold**, no # headings, no bullet dashes/asterisks) — use plain sentences and paragraphs, or lines starting with a number or a plain word if you need a list.

Context:
{context}`;

const promptTemplate = ChatPromptTemplate.fromMessages([
  ["system", SYSTEM_PROMPT],
  new MessagesPlaceholder("history"),
  ["human", "{question}"],
]);

let model: ChatGroq | null = null;

function getModel(): ChatGroq {
  if (!model) {
    model = new ChatGroq({
      model: GROQ_MODEL,
      apiKey: process.env.GROQ_API_KEY,
      // A quota-exhausted key won't succeed on retry, so don't burn the
      // request's whole timeout budget on exponential backoff.
      maxRetries: 1,
    });
  }
  return model;
}

function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "No relevant portfolio information was found.";
  }

  return chunks.map((chunk, i) => `[${i + 1}] (source: ${chunk.metadata.source})\n${chunk.content}`).join("\n\n");
}

function dedupeSources(chunks: RetrievedChunk[]): RetrievedChunk["metadata"][] {
  const seen = new Set<string>();
  const sources: RetrievedChunk["metadata"][] = [];

  for (const chunk of chunks) {
    if (seen.has(chunk.metadata.source)) continue;
    seen.add(chunk.metadata.source);
    sources.push(chunk.metadata);
  }

  return sources;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

function toChatHistory(history: ConversationMessage[]): BaseMessage[] {
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => (m.role === "user" ? new HumanMessage(m.content) : new AIMessage(m.content)));
}

export interface RagStreamResult {
  sources: RetrievedChunk["metadata"][];
  stream: IterableReadableStream<string>;
}

export async function streamAnswer(
  question: string,
  history: ConversationMessage[],
  signal?: AbortSignal
): Promise<RagStreamResult> {
  const chunks = await retrieveRelevantChunks(question);
  const chain = promptTemplate.pipe(getModel()).pipe(new StringOutputParser());

  const stream = await chain.stream(
    { context: formatContext(chunks), question, history: toChatHistory(history) },
    { signal }
  );

  return { sources: dedupeSources(chunks), stream };
}
