import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

const securityHeaders = [
  // Force HTTPS for 2 years incl. subdomains (only takes effect over HTTPS).
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Block MIME-type sniffing.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limit referrer leakage to cross-origin destinations.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Clickjacking protection (frame-ancestors 'none' in CSP is the modern equivalent).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Allow only the browser features ARUNA actually uses. geolocation (pinpoint
  // map) and microphone (voice AI) are enabled for same-origin; camera is off.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), geolocation=(self), microphone=(self), browsing-topics=()',
  },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Staged CSP: report-only so it does not break login/maps until verified.
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework in responses.
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
