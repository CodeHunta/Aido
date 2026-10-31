// Records one portfolio snapshot per user per day, so the admin dashboard can
// show how invested value changes over time. Safe to re-run: the row id is
// `${userId}:${date}`, so a second run updates that day instead of duplicating.
// Run: pnpm --filter @aido/worker snapshot
import { desc, inArray } from "@aido/db/drizzle";
import { db, portfolios, portfolioSnapshots, pricesDaily } from "@aido/db";

const date = process.env.SNAPSHOT_DATE ?? new Date().toISOString().slice(0, 10);

async function main() {
  const holdings = await db.select().from(portfolios);
  if (holdings.length === 0) {
    console.log("snapshot: no holdings to record");
    return;
  }

  const tickers = [...new Set(holdings.map((h) => h.ticker))];
  const latest = await db
    .selectDistinctOn([pricesDaily.ticker], { ticker: pricesDaily.ticker, closeKobo: pricesDaily.closeKobo })
    .from(pricesDaily)
    .where(inArray(pricesDaily.ticker, tickers))
    .orderBy(pricesDaily.ticker, desc(pricesDaily.date));
  const priceOf = new Map(latest.map((p) => [p.ticker, Number(p.closeKobo ?? 0)]));

  const byUser = new Map<string, typeof holdings>();
  for (const h of holdings) {
    const arr = byUser.get(h.userId) ?? [];
    arr.push(h);
    byUser.set(h.userId, arr);
  }

  let written = 0;
  for (const [userId, rows] of byUser) {
    let value = 0;
    let cost = 0;
    const allocation: Record<string, number> = {};
    for (const h of rows) {
      const px = priceOf.get(h.ticker);
      if (px == null || px <= 0) continue;
      const qty = Number(h.qty);
      const v = qty * px;
      value += v;
      cost += qty * Number(h.avgCostKobo);
      allocation[h.ticker] = v;
    }
    if (value <= 0) continue;
    // Store weights, not raw naira, so the shape of the portfolio is readable.
    for (const ticker of Object.keys(allocation)) allocation[ticker] = (allocation[ticker] ?? 0) / value;

    await db
      .insert(portfolioSnapshots)
      .values({
        id: `${userId}:${date}`,
        userId,
        date,
        valueKobo: Math.round(value),
        pnlKobo: Math.round(value - cost),
        allocation,
      })
      .onConflictDoUpdate({
        target: portfolioSnapshots.id,
        set: {
          valueKobo: Math.round(value),
          pnlKobo: Math.round(value - cost),
          allocation,
        },
      });
    written += 1;
  }

  console.log(`snapshot: ${written} user portfolio(s) for ${date}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
