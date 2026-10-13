export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  categories: string[];
  asset: string;
  closeKobo: number | null;
  asOf: string | null;
  source: string | null;
  volatility: number | null;
  dividendYield: number | null;
  score: number | null;
  action: string | null;
  confidence: string | null;
  suitability?: string | null;
}

export interface Holding {
  ticker: string;
  name: string;
  qty: number;
  avgCostKobo: number;
  priceKobo: number | null;
}

export interface AlertItem {
  id: string;
  type: string;
  ticker: string | null;
  title: string;
  body: string;
  createdAt: string | null;
}

export interface Profile {
  risk: string;
  horizon: string;
  objective: string;
  capitalKobo: number;
  frequency: string;
}
