import type { Quote } from "./types";

export function americanToDecimal(american: number): number | null {
  if (!Number.isFinite(american)) return null;
  if (american > 0) return 1 + american / 100;
  if (american < 0) return 1 + 100 / Math.abs(american);
  return null;
}

export function impliedProb(decimal: number) { 
  return 1 / decimal; 
}

export function groupBy<T, K extends string | number>(xs: T[], key: (t: T) => K) {
  return xs.reduce((acc, x) => { 
    const k = key(x); 
    (acc as any)[k] ||= []; 
    (acc as any)[k].push(x); 
    return acc; 
  }, {} as Record<K, T[]>);
}

export function toFixedPct(x: number | null | undefined, digits = 2) { 
  return x == null || !isFinite(x) ? "–" : `${(x * 100).toFixed(digits)}%`; 
}

export function findTwoWayArb(
  home: Quote[], away: Quote[], feeHome = 0, feeAway = 0
): null | { h: Quote; a: Quote; profitPct: number; s1: number; s2: number } {
  let best: any = null;
  for (const h of home) for (const a of away) {
    if (h.book === a.book) continue;
    const inv = 1 / h.decimal + 1 / a.decimal;
    if (inv < 1) {
      const total = 100;
      const s1 = (total * (1 / h.decimal)) / inv;
      const s2 = total - s1;
      const r1 = s1 * (h.decimal - 1) * (1 - (h.feePct ?? feeHome));
      const r2 = s2 * (a.decimal - 1) * (1 - (a.feePct ?? feeAway));
      const profitPct = Math.min(r1, r2) / total;
      if (!best || profitPct > best.profitPct) best = { h, a, profitPct, s1, s2 };
    }
  }
  return best;
}
