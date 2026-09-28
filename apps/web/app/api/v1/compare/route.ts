import { getFinancial, getTraits } from "@aido/db/traits";
import { bad, ok } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const tickers = (new URL(req.url).searchParams.get("tickers") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean).slice(0, 3);
  if (tickers.length < 2) return bad("Pass ?tickers=A,B");
  const rows = [];
  for (const ticker of tickers) {
    const [t, fin] = await Promise.all([getTraits(ticker), getFinancial(ticker)]);
    if (!t) return bad(`Unknown ticker ${ticker}`, 404);
    rows.push({ ...t, financials: fin ? { pe: null, roe: fin.roe, profitMargin: fin.profitMargin, debtToEquity: fin.debtToEquity, payoutRatio: fin.payoutRatio } : null });
  }
  return ok(rows);
}
