// Indonesian phone number helpers for the POS digital receipt flow.
//
// WhatsApp deep links (wa.me) require the number in international format
// WITHOUT the leading "+" or any separators, e.g. 6281234567890. Cashiers,
// however, typically type numbers as "0812-3456-7890", "+62 812 ...", or
// "812...". These helpers normalize any of those into the wa.me format and
// validate that the result looks like a real Indonesian mobile number.

/**
 * Normalize a raw Indonesian phone string into wa.me format: `62XXXXXXXXXX`.
 * Returns an empty string when the input has no digits.
 *
 * Rules:
 * - strip everything that is not a digit (spaces, dashes, parentheses, "+")
 * - a leading "0"      -> replaced with "62"   (08xx -> 628xx)
 * - a leading "62"     -> kept as-is
 * - a leading "8"      -> prefixed with "62"    (8xx  -> 628xx)
 * - anything else      -> prefixed with "62" defensively
 */
export function normalizeWhatsappNumber(raw: string | null | undefined): string {
  if (!raw) return '';

  let digits = String(raw).replace(/\D/g, '');
  if (!digits) return '';

  // Some users paste a double country code like "6208123..."; collapse it.
  if (digits.startsWith('620')) {
    digits = '62' + digits.slice(3);
  }

  if (digits.startsWith('62')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return '62' + digits.slice(1);
  }
  if (digits.startsWith('8')) {
    return '62' + digits;
  }
  // Fallback: assume the country code is missing entirely.
  return '62' + digits;
}

/**
 * Validate that a raw phone string resolves to a plausible Indonesian mobile
 * number. Indonesian mobile numbers start with 8 after the country code and
 * the full national significant number is ~10-13 digits (so 62 + 9..12).
 */
export function isValidWhatsappNumber(raw: string | null | undefined): boolean {
  const normalized = normalizeWhatsappNumber(raw);
  // 62 + "8" + at least 8 more digits, capped to avoid pasted garbage.
  return /^628\d{7,11}$/.test(normalized);
}

/**
 * Present a normalized number in a friendly, readable form for the UI, e.g.
 * `6281234567890` -> `+62 812-3456-7890`. Falls back to the raw input when it
 * cannot be normalized.
 */
export function formatWhatsappDisplay(raw: string | null | undefined): string {
  const n = normalizeWhatsappNumber(raw);
  if (!n) return '';
  const rest = n.slice(2); // drop country code
  const groups = rest.replace(/(\d{3,4})(?=\d)/g, '$1-');
  return `+62 ${groups}`;
}
