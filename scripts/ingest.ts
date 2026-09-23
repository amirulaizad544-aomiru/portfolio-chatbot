import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { createEmbedding } from "../lib/embeddings";
import { getSupabaseClient } from "../lib/supabase";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

const DOCUMENT_TYPES: Record<string, string> = {
  "about.md": "about",
  "education.md": "education",
  "experience.md": "experience",
  "skills.md": "skill",
  "projects.md": "project",
  "ecoquest.md": "project",
  "internship.md": "internship",
  "career.md": "career",
};

interface Chunk {
  content: string;
  metadata: { source: string; type: string };
}

function splitIntoChunks(text: string): string[] {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (candidate.length <= CHUNK_SIZE) {
      current = candidate;
      continue;
    }

    if (current) chunks.push(current);

    if (paragraph.length <= CHUNK_SIZE) {
      current = paragraph;
    } else {
      // Paragraph itself exceeds the limit; hard-split with overlap.
      for (let i = 0; i < paragraph.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
        chunks.push(paragraph.slice(i, i + CHUNK_SIZE));
      }
      current = "";
    }
  }

  if (current) chunks.push(current);

  return chunks;
}

async function loadChunks(): Promise<Chunk[]> {
  const files = (await readdir(KNOWLEDGE_DIR)).filter((f) => f.endsWith(".md"));

  const chunks: Chunk[] = [];

  for (const file of files) {
    const raw = await readFile(path.join(KNOWLEDGE_DIR, file), "utf-8");
    const type = DOCUMENT_TYPES[file] ?? "info";

    for (const content of splitIntoChunks(raw)) {
      chunks.push({ content, metadata: { source: file, type } });
    }
  }

  return chunks;
}

async function main() {
  const supabase = getSupabaseClient();

  console.log("Loading knowledge files...");
  const chunks = await loadChunks();
  console.log(`Loaded ${chunks.length} chunks from knowledge/.`);

  if (chunks.length === 0) {
    console.log("Nothing to ingest.");
    return;
  }

  const sources = [...new Set(chunks.map((c) => c.metadata.source))];
  console.log(`Clearing existing rows for: ${sources.join(", ")}`);
  for (const source of sources) {
    const { error } = await supabase.from("documents").delete().eq("metadata->>source", source);
    if (error) throw new Error(`Failed to clear existing rows for ${source}: ${error.message}`);
  }

  console.log("Generating embeddings and inserting rows...");
  let inserted = 0;

  for (const chunk of chunks) {
    const embedding = await createEmbedding(chunk.content);

    const { error } = await supabase.from("documents").insert({
      content: chunk.content,
      metadata: chunk.metadata,
      embedding,
    });

    if (error) {
      throw new Error(`Failed to insert chunk from ${chunk.metadata.source}: ${error.message}`);
    }

    inserted += 1;
  }

  console.log(`Ingestion complete. Inserted ${inserted} chunk(s).`);
}

main().catch((error) => {
  console.error("Ingestion failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
