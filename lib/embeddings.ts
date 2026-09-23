import { pipeline, type FeatureExtractionPipeline } from "@xenova/transformers";

const EMBEDDING_MODEL = "Xenova/all-MiniLM-L6-v2"; // 384 dimensions

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
