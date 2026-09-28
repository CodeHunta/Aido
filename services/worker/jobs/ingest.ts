// Phase 3.5 plug — swap seed-sample data for a real NGX feed without touching scoring.
// Contract: any vendor (NGX X-Data, broker feed, CSV drop) implements IngestAdapter.
// Quality gates live here: >3d missing prices → exclude from picks + cap Confidence
// at Medium; financials >18mo stale → cap Fundamental score (enforced in scoring).

export interface PriceBar {
  ticker: string;
  date: string; // YYYY-MM-DD
  openKobo: number;
  highKobo: number;
  lowKobo: number;
  closeKobo: number;
  volume: number;
  marketCapKobo?: number;
}

export interface FinancialRow {
  ticker: string;
  period: string; // e.g. FY2025
  periodEnd: string;
  revenueKobo?: number;
  earningsKobo?: number;
  epsKobo?: number;
  profitMargin?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  fcfKobo?: number;
  payoutRatio?: number;
  source: string;
}

export interface DividendRow {
  ticker: string;
  declDate?: string;
  qualDate?: string;
  payDate?: string;
  dpsKobo?: number;
  yieldAtDecl?: number;
}

export interface IngestAdapter {
  readonly name: string;
  fetchPrices(since: string): Promise<PriceBar[]>;
  fetchFinancials(): Promise<FinancialRow[]>;
  fetchDividends(): Promise<DividendRow[]>;
}

// Freshness check used by scoring + weekly picks.
export function maxGapDays(sortedDates: string[]): number {
  let gap = 0;
  for (let i = 1; i < sortedDates.length; i++) {
    const diff =
      (new Date(sortedDates[i]!).getTime() - new Date(sortedDates[i - 1]!).getTime()) / 86400000;
    gap = Math.max(gap, Math.round(diff) - 1);
  }
  return gap;
}
