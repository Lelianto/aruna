import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Content Security Policy tailored to ARUNA's real dependencies:
 * - Next.js/React inline bootstrap + inline style attributes -> 'unsafe-inline'
 *   ('unsafe-eval' only in dev, needed by React Refresh)
 * - Firebase Auth (Google sign-in popup/iframe): apis.google.com, gstatic,
 *   accounts.google.com, <project>.firebaseapp.com
 * - Firestore + Firebase realtime/token endpoints: *.googleapis.com (+ wss),
 *   identitytoolkit / securetoken
 * - Leaflet map tiles + markers: carto basemaps, cdnjs; Google avatars; QR codes
 * - OSRM routing (client-side distance calc): router.project-osrm.org
 * - Google Fonts: fonts.googleapis.com (css) + fonts.gstatic.com (files)
 *
 * NOTE: This is served as Content-Security-Policy-Report-Only for now so it can
 * be validated in production without breaking login/maps. Once the browser
 * console / report endpoint shows no violations, rename the header key to
 * `Content-Security-Policy` to enforce it. For maximum XSS protection, migrate
 * to a nonce-based policy via proxy.ts (drops 'unsafe-inline' from script-src),
 * noting that nonces force all pages into dynamic rendering.
 */
const cspDirectives = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://apis.google.com https://www.gstatic.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.googleapis.com wss://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://router.project-osrm.org",
  "frame-src 'self' https://*.firebaseapp.com https://apis.google.com https://accounts.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

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
  { key: 'Content-Security-Policy-Report-Only', value: cspDirectives },
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
