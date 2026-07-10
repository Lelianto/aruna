// Simple in-memory sliding-window rate limiter, scoped per server instance.
//
// Used to protect shared, quota-limited upstream APIs (e.g. the Gemini free
// tier, capped at 15 requests/minute) from being exhausted by a single
// feature such as the Aruna Help chatbot. This limits *this app's* usage of
// the API defensively — it does not replace the upstream provider's own
// rate limiting, which can still reject requests (handled separately, see
// isRateLimitError in help-chat route).

interface Window {
  timestamps: number[];
}

const windows = new Map<string, Window>();

/**
 * Returns { allowed: true } if the call is within the limit, otherwise
 * { allowed: false, retryAfterMs } with the time until the oldest request
 * in the window expires.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const win = windows.get(key) || { timestamps: [] };

  // Drop timestamps outside the current window.
  win.timestamps = win.timestamps.filter((t) => now - t < windowMs);

  if (win.timestamps.length >= maxRequests) {
    const oldest = win.timestamps[0];
    windows.set(key, win);
    return { allowed: false, retryAfterMs: windowMs - (now - oldest) };
  }

  win.timestamps.push(now);
  windows.set(key, win);
  return { allowed: true };
}
