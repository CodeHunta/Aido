import { eq } from "@aido/db/drizzle";
import { db } from "@aido/db";
import { portfolios } from "@aido/db/schema";
import { getTraits } from "@aido/db/traits";
import { analyzePortfolio } from "@aido/scoring";
import { ok, userOf } from "../../_lib";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const userId = await userOf(req);
  const held = await db.select().from(portfolios).where(eq(portfolios.userId, userId));
  const inputs = [];
  for (const h of held) {
    const t = await getTraits(h.ticker);
    inputs.push({
      ticker: h.ticker,
      qty: Number(h.qty),
      avgCostKobo: Number(h.avgCostKobo),
      priceKobo: t?.closeKobo ?? 0,
      sector: t?.sector ?? "",
      dividendYield: t?.dividendYield ?? null,
    });
  }
  return ok(analyzePortfolio(inputs));
}
