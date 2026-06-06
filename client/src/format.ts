// Formatting helpers — Indian number system (Lakh / Crore) and plot sizes.

const LAKH = 100_000;
const CRORE = 10_000_000;

// Drop a trailing ".0" so "5.0" shows as "5".
function trim(n: number): string {
  return n % 1 === 0 ? String(n) : n.toFixed(2).replace(/\.?0+$/, '');
}

// Money in short Indian form:
//   5200000   -> "₹52 L"
//   52000000  -> "₹5.2 Cr"
//   85000     -> "₹85,000"
export function formatINR(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '—';
  if (amount >= CRORE) return `₹${trim(Math.round((amount / CRORE) * 100) / 100)} Cr`;
  if (amount >= LAKH) return `₹${trim(Math.round((amount / LAKH) * 100) / 100)} L`;
  // Under a lakh: full number with Indian grouping (e.g. 85,000).
  return `₹${amount.toLocaleString('en-IN')}`;
}

// Full grouped amount, e.g. "₹52,00,000" — used in detail views/tooltips.
export function formatINRFull(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
}

// 1 gaj = 1 sq yard = 9 sq ft. Calculate gaj from width x length in feet.
export function gajFromFeet(width: number, length: number): number {
  if (!width || !length) return 0;
  return Math.round(((width * length) / 9) * 100) / 100;
}

// Total square feet from dimensions.
export function sqFtFromFeet(width: number, length: number): number {
  if (!width || !length) return 0;
  return Math.round(width * length * 100) / 100;
}

// Human-readable size line, e.g. "45 × 50 ft · 250 gaj · 2,250 sq ft".
export function formatSize(deal: {
  width_ft: number | null;
  length_ft: number | null;
  gaj: number | null;
}): string {
  const parts: string[] = [];
  if (deal.width_ft && deal.length_ft) {
    parts.push(`${trim(deal.width_ft)} × ${trim(deal.length_ft)} ft`);
  }
  if (deal.gaj) parts.push(`${trim(deal.gaj)} gaj`);
  if (deal.width_ft && deal.length_ft) {
    parts.push(`${sqFtFromFeet(deal.width_ft, deal.length_ft).toLocaleString('en-IN')} sq ft`);
  }
  return parts.join(' · ') || 'Size not set';
}

// Labels and order for the four statuses.
export const STATUS_LABELS: Record<string, string> = {
  available: 'Available',
  negotiation: 'In Negotiation',
  hold: 'On Hold',
  sold: 'Sold · Closed',
};

export const STATUS_ORDER = ['available', 'negotiation', 'hold', 'sold'] as const;
