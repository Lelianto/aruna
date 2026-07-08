/**
 * COMMODITY_UNITS — Daftar lengkap satuan untuk semua jenis produk
 * yang bisa dijual oleh koperasi di platform Aruna.
 *
 * Dikelompokkan berdasarkan jenis satuan untuk kemudahan pemilihan.
 */

/**
 * Normalizes a product name so every word starts with a capital letter.
 * e.g. "beras organik" → "Beras Organik", "JAGUNG MANIS" → "Jagung Manis"
 */
export function normalizeProductName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export interface UnitOption {
  value: string;
  label: string;       // Nama tampilan
  group: string;       // Kelompok (untuk grouping di select)
  aliases?: string[];  // Alias yang diterima normalizer (huruf kecil)
}

export const COMMODITY_UNIT_OPTIONS: UnitOption[] = [
  // ── Berat ──────────────────────────────────────────────────────────────────
  { value: 'Gram',    label: 'Gram (g)',          group: 'Berat',    aliases: ['gram', 'gr', 'g'] },
  { value: 'Ons',     label: 'Ons (100 g)',        group: 'Berat',    aliases: ['ons', 'hg'] },
  { value: 'Kg',      label: 'Kilogram (kg)',       group: 'Berat',    aliases: ['kg', 'kilo', 'kilogram'] },
  { value: 'Kuintal', label: 'Kuintal (100 kg)',    group: 'Berat',    aliases: ['kuintal', 'kwintal', 'kw', 'q'] },
  { value: 'Ton',     label: 'Ton (1.000 kg)',      group: 'Berat',    aliases: ['ton', 'tonne', 't'] },

  // ── Volume ─────────────────────────────────────────────────────────────────
  { value: 'mL',      label: 'Mililiter (mL)',      group: 'Volume',   aliases: ['ml', 'mililiter', 'milliliter'] },
  { value: 'Liter',   label: 'Liter (L)',            group: 'Volume',   aliases: ['liter', 'litre', 'ltr', 'l'] },
  { value: 'Galon',   label: 'Galon (19 L)',         group: 'Volume',   aliases: ['galon', 'gallon'] },

  // ── Butiran / Biji ────────────────────────────────────────────────────────
  { value: 'Butir',   label: 'Butir',               group: 'Biji',     aliases: ['butir', 'btr'] },
  { value: 'Biji',    label: 'Biji',                 group: 'Biji',     aliases: ['biji', 'bij'] },
  { value: 'Buah',    label: 'Buah',                 group: 'Biji',     aliases: ['buah', 'bh'] },

  // ── Kemasan / Paket ───────────────────────────────────────────────────────
  { value: 'Karung',  label: 'Karung (50 kg)',       group: 'Kemasan',  aliases: ['karung', 'sak', 'zak'] },
  { value: 'Sak',     label: 'Sak (40 kg)',          group: 'Kemasan',  aliases: [] },
  { value: 'Krat',    label: 'Krat',                 group: 'Kemasan',  aliases: ['krat', 'crate'] },
  { value: 'Peti',    label: 'Peti',                 group: 'Kemasan',  aliases: ['peti', 'box', 'kotak'] },
  { value: 'Dus',     label: 'Dus / Karton',         group: 'Kemasan',  aliases: ['dus', 'kardus', 'karton', 'carton'] },
  { value: 'Bungkus', label: 'Bungkus',              group: 'Kemasan',  aliases: ['bungkus', 'bks', 'pak', 'pack'] },
  { value: 'Kemasan', label: 'Kemasan',              group: 'Kemasan',  aliases: ['kemasan'] },
  { value: 'Botol',   label: 'Botol',                group: 'Kemasan',  aliases: ['botol', 'bottle'] },
  { value: 'Kaleng',  label: 'Kaleng',               group: 'Kemasan',  aliases: ['kaleng', 'can', 'tin'] },
  { value: 'Jerigen', label: 'Jerigen',              group: 'Kemasan',  aliases: ['jerigen', 'jeriken', 'jerrycan'] },

  // ── Pertanian / Perkebunan ────────────────────────────────────────────────
  { value: 'Ikat',    label: 'Ikat',                 group: 'Pertanian', aliases: ['ikat', 'bundle'] },
  { value: 'Tandan',  label: 'Tandan',               group: 'Pertanian', aliases: ['tandan', 'bunch'] },
  { value: 'Sisir',   label: 'Sisir (pisang)',        group: 'Pertanian', aliases: ['sisir', 'hand'] },
  { value: 'Bonggol', label: 'Bonggol',              group: 'Pertanian', aliases: ['bonggol', 'corm'] },
  { value: 'Batang',  label: 'Batang',               group: 'Pertanian', aliases: ['batang', 'stem', 'stalk'] },
  { value: 'Pohon',   label: 'Pohon',                group: 'Pertanian', aliases: ['pohon', 'tree'] },
  { value: 'Rumpun',  label: 'Rumpun',               group: 'Pertanian', aliases: ['rumpun', 'clump'] },
  { value: 'Kilang',  label: 'Kilang (padi)',         group: 'Pertanian', aliases: ['kilang'] },

  // ── Peternakan ────────────────────────────────────────────────────────────
  { value: 'Ekor',    label: 'Ekor (hewan)',          group: 'Peternakan', aliases: ['ekor', 'head', 'tail'] },
  { value: 'Rak',     label: 'Rak (30 telur)',        group: 'Peternakan', aliases: ['rak', 'tray', 'try'] },
  { value: 'Lusin',   label: 'Lusin (12 butir)',      group: 'Peternakan', aliases: ['lusin', 'dozen', 'doz'] },

  // ── Perikanan ─────────────────────────────────────────────────────────────
  { value: 'Keranjang', label: 'Keranjang',           group: 'Perikanan', aliases: ['keranjang', 'basket', 'ember'] },
  { value: 'Ekor Ikan', label: 'Ekor (ikan)',         group: 'Perikanan', aliases: ['ekor ikan'] },

  // ── Satuan Umum ───────────────────────────────────────────────────────────
  { value: 'Pcs',     label: 'Pcs / Lembar',          group: 'Umum',     aliases: ['pcs', 'pc', 'lembar', 'sheet'] },
  { value: 'Unit',    label: 'Unit',                  group: 'Umum',     aliases: ['unit'] },
  { value: 'Set',     label: 'Set',                   group: 'Umum',     aliases: ['set'] },
  { value: 'Loyang',  label: 'Loyang',                group: 'Umum',     aliases: ['loyang', 'pan'] },
  { value: 'Rol',     label: 'Rol / Gulung',          group: 'Umum',     aliases: ['rol', 'roll', 'gulung'] },
];

/** Plain list of canonical unit values — for dropdowns. */
export const COMMODITY_UNITS: string[] = COMMODITY_UNIT_OPTIONS.map(u => u.value);

/**
 * Normalizes any raw unit string to its canonical form.
 * Returns 'Kg' as the safe default if no match found.
 */
export function normalizeUnit(raw: string): string {
  if (!raw) return 'Kg';
  const n = raw.trim().toLowerCase();
  for (const opt of COMMODITY_UNIT_OPTIONS) {
    if (opt.value.toLowerCase() === n) return opt.value;
    if (opt.aliases?.includes(n)) return opt.value;
  }
  // Capitalise first letter as best-effort fallback
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

/** Returns grouped options for use with CustomSelect that supports groups. */
export function getGroupedUnitOptions() {
  const groups: Record<string, { value: string; label: string }[]> = {};
  for (const opt of COMMODITY_UNIT_OPTIONS) {
    if (!groups[opt.group]) groups[opt.group] = [];
    groups[opt.group].push({ value: opt.value, label: opt.label });
  }
  return groups;
}
