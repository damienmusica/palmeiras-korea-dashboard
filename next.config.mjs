/** @type {import('next').NextConfig} */

// Security headers applied to every response. The CSP is intentionally
// pragmatic: Next's App Router injects inline bootstrap scripts/styles, so a
// nonce-less strict policy would break hydration. We still lock down framing,
// object/base/form targets, and restrict connect/img/script origins. The app
// has no dangerouslySetInnerHTML and no user-generated markup, so the residual
// 'unsafe-inline' risk is low; a nonce-based CSP is a documented future step.
const ContentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: ContentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Remote crests/photos are optional. We default to local SVG assets so the
  // app never shows broken images, but allow opt-in remote hosts via env if
  // desired.
  images: {
    remotePatterns: [],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
