import { pipeline, env, type FeatureExtractionPipeline } from "@xenova/transformers";

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2"; // 384 dimensions

// Vercel's serverless filesystem is read-only except /tmp; the default cache
// dir (./.cache) fails to write there, so redirect it on any deployment
// that sets VERCEL (also true for other read-only-root platforms via TMPDIR).
if (process.env.VERCEL) {
  env.cacheDir = "/tmp/xenova-cache";
}

let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", EMBEDDING_MODEL) as Promise<FeatureExtractionPipeline>;
  }
  return extractorPromise;
}

export async function createEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}
