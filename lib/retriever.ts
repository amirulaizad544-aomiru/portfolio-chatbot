import { createEmbedding } from "./embeddings";
import { getSupabaseClient } from "./supabase";

export interface RetrievedChunk {
  content: string;
  metadata: { source: string; type: string };
  similarity: number;
}

const DEFAULT_TOP_K = 4;
// all-MiniLM-L6-v2 cosine similarities for genuinely relevant chunks tend to
// land in the 0.3-0.45 range for short questions against paragraph-sized
// chunks, so a high threshold (e.g. 0.5) filters out real matches.
const MATCH_THRESHOLD = 0.2;

interface MatchDocumentsRow {
  content: string;
  metadata: { source: string; type: string };
  similarity: number;
}

export async function retrieveRelevantChunks(
  query: string,
  topK = DEFAULT_TOP_K
): Promise<RetrievedChunk[]> {
  const embedding = await createEmbedding(query);
  const supabase = getSupabaseClient();

  const { data, error } = await supabase.rpc("match_documents", {
    query_embedding: embedding,
    match_count: topK,
    match_threshold: MATCH_THRESHOLD,
  });

  if (error) {
    throw new Error(`Retrieval failed: ${error.message}`);
  }

  return ((data ?? []) as MatchDocumentsRow[]).map((row) => ({
    content: row.content,
    metadata: row.metadata,
    similarity: row.similarity,
  }));
}
