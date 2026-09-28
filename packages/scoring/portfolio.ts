// Portfolio intelligence: value, gains, allocation, concentration, income,
// plus "what happens if I buy this?" impact. Pure functions over holdings.
export interface HoldingInput {
  ticker: string;
  qty: number;
  avgCostKobo: number;
  priceKobo: number; // latest close
  sector: string;
  dividendYield: number | null;
}

export interface AllocationSlice {
  key: string;
  weight: number; // 0-1
  valueKobo: number;
}

export interface PortfolioAnalysis {
  valueKobo: number;
  costKobo: number;
  pnlKobo: number;
  pnlPct: number;
  allocation: AllocationSlice[]; // by sector
  topWeight: number;
  concentrationFlag: boolean; // any single stock >25%
  dividendYield: number; // weighted
  weaknesses: string[];
}

export function analyzePortfolio(holdings: HoldingInput[]): PortfolioAnalysis {
  const valueKobo = holdings.reduce((a, h) => a + h.qty * h.priceKobo, 0);
  const costKobo = holdings.reduce((a, h) => a + h.qty * h.avgCostKobo, 0);
  const pnlKobo = valueKobo - costKobo;
  const bySector = new Map<string, number>();
  let topWeight = 0;
  let divSum = 0;
  for (const h of holdings) {
    const v = h.qty * h.priceKobo;
    bySector.set(h.sector, (bySector.get(h.sector) ?? 0) + v);
    if (valueKobo > 0) topWeight = Math.max(topWeight, v / valueKobo);
    divSum += v * (h.dividendYield ?? 0);
  }
  const allocation: AllocationSlice[] = [...bySector.entries()]
    .map(([key, value]) => ({ key, weight: valueKobo > 0 ? value / valueKobo : 0, valueKobo: value }))
    .sort((a, b) => b.weight - a.weight);
  const weaknesses: string[] = [];
  if (topWeight > 0.25) weaknesses.push(`One stock is ${(topWeight * 100).toFixed(0)}% — over the 25% safety line`);
  if (allocation.length > 0 && allocation[0]!.weight > 0.5)
    weaknesses.push(`${allocation[0]!.key} is ${(allocation[0]!.weight * 100).toFixed(0)}% — sector-heavy`);
  if (holdings.length > 0 && holdings.length < 3) weaknesses.push("Only a few stocks — one shock hits hard");
  return {
    valueKobo,
    costKobo,
    pnlKobo,
    pnlPct: costKobo > 0 ? pnlKobo / costKobo : 0,
    allocation,
    topWeight,
    concentrationFlag: topWeight > 0.25,
    dividendYield: valueKobo > 0 ? divSum / valueKobo : 0,
    weaknesses,
  };
}

export interface BuyImpact {
  newWeight: number;
  sectorBefore: number;
  sectorAfter: number;
  line: string; // e.g. "Financials 18% → 24%"
}

export function impactOfBuy(
  holdings: HoldingInput[],
  candidate: { ticker: string; sector: string; priceKobo: number; spendKobo: number },
): BuyImpact {
  const base = analyzePortfolio(holdings);
  const sectorBefore = base.allocation.find((a) => a.key === candidate.sector)?.weight ?? 0;
  const newValue = base.valueKobo + candidate.spendKobo;
  const sectorValue = (base.allocation.find((a) => a.key === candidate.sector)?.valueKobo ?? 0) + candidate.spendKobo;
  const sectorAfter = newValue > 0 ? sectorValue / newValue : 0;
  const newWeight = newValue > 0 ? candidate.spendKobo / newValue : 0;
  return {
    newWeight,
    sectorBefore,
    sectorAfter,
    line: `${candidate.sector} ${(sectorBefore * 100).toFixed(0)}% → ${(sectorAfter * 100).toFixed(0)}%`,
  };
}
