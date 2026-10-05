// One-time continuity splice (Phase 3.5).
// Our seed-sample history was invented; real NGX closes now exist. To avoid a
// fake cliff on charts (and fake momentum crashes in scoring), past sample
// bars are rescaled so the last sample bar meets the first real bar — the same
// adjustment incumbents apply on vendor switches or splits. Daily RETURNS are
// untouched, so momentum/volatility shapes stay as seeded; only levels align.
// Real rows (source=ngx-delayed) are never modified.
// Run once: pnpm --filter @aido/worker ngx:splice
import { and, desc, eq } from "@aido/db/drizzle";
import { db, pricesDaily } from "@aido/db";

async function main() {
  const tickers = await db.selectDistinct({ ticker: pricesDaily.ticker }).from(pricesDaily);
  for (const { ticker } of tickers) {
    const firstReal = (
      await db.select().from(pricesDaily).where(and(eq(pricesDaily.ticker, ticker), eq(pricesDaily.source, "ngx-delayed"))).orderBy(pricesDaily.date).limit(1)
    )[0];
    if (!firstReal?.closeKobo) continue;
    const lastSample = (
      await db.select().from(pricesDaily).where(and(eq(pricesDaily.ticker, ticker), eq(pricesDaily.source, "seed-sample"))).orderBy(desc(pricesDaily.date)).limit(1)
    )[0];
    if (!lastSample?.closeKobo || lastSample.closeKobo === 0) continue;
    // Skip if already spliced (sample tail already meets real head within 1%)
    if (Math.abs(lastSample.closeKobo - firstReal.closeKobo) / firstReal.closeKobo < 0.01) {
      console.log(`[splice] ${ticker}: already aligned`);
      continue;
    }
    const f = firstReal.closeKobo / lastSample.closeKobo;
    const rows = await db.select().from(pricesDaily).where(and(eq(pricesDaily.ticker, ticker), eq(pricesDaily.source, "seed-sample")));
    for (const r of rows) {
      const px = (v: number | null) => (v == null ? null : Math.max(1, Math.round(v * f)));
      await db
        .update(pricesDaily)
        .set({
          openKobo: px(r.openKobo),
          highKobo: px(r.highKobo),
          lowKobo: px(r.lowKobo),
          closeKobo: px(r.closeKobo),
          marketCapKobo: r.marketCapKobo == null ? null : Math.round(r.marketCapKobo * f),
        })
        .where(and(eq(pricesDaily.ticker, ticker), eq(pricesDaily.date, r.date)));
    }
    console.log(`[splice] ${ticker}: rescaled ${rows.length} sample bars x${f.toFixed(3)}`);
  }
  console.log("[splice] done. Daily returns untouched; levels now meet real closes.");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
