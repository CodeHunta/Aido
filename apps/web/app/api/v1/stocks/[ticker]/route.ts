import { getFinancial, getProfile, getThesis, getTraits, recentPrices } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import { bad, ok, userOf } from "../../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker).toUpperCase();
  const t = await getTraits(ticker);
  if (!t) return bad("Unknown ticker", 404);
  const profile = await getProfile(userOf(req));
  const suitability = profile
    ? suitFor(
        { risk: profile.risk, horizon: profile.horizon, objective: profile.objective },
        { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield },
      )
    : null;
  const [fin, thesis, prices] = await Promise.all([getFinancial(ticker), getThesis(ticker), recentPrices(ticker, 30)]);
  return ok({ ...t, suitability, financials: fin, recommendation: thesis ? { action: thesis.action, score: thesis.score, confidence: thesis.confidence, why: thesis.why, keyRisk: thesis.keyRisk } : null, prices: prices.map((p) => ({ date: p.date, closeKobo: p.closeKobo })) }, t.asOf);
}
