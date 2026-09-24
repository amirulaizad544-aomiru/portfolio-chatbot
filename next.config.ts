import type { NextConfig } from "next";

// Only these origins may embed this app in an <iframe>. Add this project's
// own deployed domain here once it exists, alongside the portfolio's.
const ALLOWED_FRAME_ANCESTORS = [
  "'self'",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://amirul-personal-portfolio.vercel.app",
].join(" ");

const nextConfig: NextConfig = {
  // @xenova/transformers pulls in onnxruntime-node, whose native
  // libonnxruntime.so / onnxruntime_binding.node aren't picked up by
  // Next's file tracer automatically, so Vercel's deployed function is
  // missing them at runtime. Trace them in explicitly for the route that
  // (transitively, via lib/embeddings.ts) loads the embedding model.
  outputFileTracingIncludes: {
    "/api/chat": ["./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/**/*"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${ALLOWED_FRAME_ANCESTORS};`,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
