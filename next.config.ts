import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline for styles; framer-motion needs it for inline styles
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Allow scripts from self + Next.js internals; 'unsafe-eval' needed for some Next.js features in dev
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Images: self, data URIs, blob (for local previews), fal.ai CDN, and any R2/Cloudflare endpoint
      "img-src 'self' data: blob: https://*.fal.media https://*.fal.run https://*.r2.cloudflarestorage.com https://*.r2.dev https://*.cloudflare.com",
      // Video/media same as images
      "media-src 'self' blob: https://*.fal.media https://*.fal.run https://*.r2.cloudflarestorage.com https://*.r2.dev https://*.cloudflare.com",
      // API calls: self + fal.ai endpoints + R2 (for blob download fetch)
      "connect-src 'self' https://queue.fal.run https://fal.run https://api.fal.ai https://*.fal.media https://*.fal.run wss://*.fal.run https://*.r2.cloudflarestorage.com https://*.r2.dev",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  compress: true,
  allowedDevOrigins: ["100.119.162.2"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.fal.media" },
      { protocol: "https", hostname: "**.fal.run" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "**.r2.dev" },
      { protocol: "https", hostname: "storage.googleapis.com" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
