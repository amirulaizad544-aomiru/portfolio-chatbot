import type { NextConfig } from "next";

// Only these origins may embed this app in an <iframe>. Add this project's
// own deployed domain here once it exists, alongside the portfolio's.
const ALLOWED_FRAME_ANCESTORS = [
  "'self'",
  "http://localhost:3000",
  "http://localhost:3001",
  "https://personal-portfolio-two-psi-79.vercel.app",
].join(" ");

const nextConfig: NextConfig = {
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
