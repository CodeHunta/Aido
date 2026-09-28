// Phase 3 seed — 40-ticker NGX universe with 12 months of prices + FY financials.
// HONESTY NOTE: prices/financials here are deterministic SAMPLE data (source='seed-sample')
// so scoring and screens can be built. Replaced by a real NGX feed in Phase 3.5.
// Metadata (ticker/name/sector/categories) is real. Run: pnpm --filter @aido/db seed
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { db } from "./index.js";
import { dividends, financials, pricesDaily, stocks } from "./schema.js";

const root = dirname(fileURLToPath(import.meta.url));
const rows = readFileSync(join(root, "seed-data.csv"), "utf8").trim().split("\n").slice(1);

// Deterministic PRNG so re-seeds are identical
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7);

const TRADING_DAYS = 250;
const END = new Date("2026-09-26T00:00:00Z");

function tradingDates(): string[] {
  const out: string[] = [];
  const d = new Date(END);
  while (out.length < TRADING_DAYS) {
    const day = d.getUTCDay();
    if (day !== 0 && day !== 6) out.unshift(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return out;
}

async function main() {
  const dates = tradingDates();
  let priceRows = 0;

  for (const line of rows) {
    const [ticker, name, sector, cats] = line.split(",");
    if (!ticker || !name || !sector || !cats) throw new Error(`Bad CSV line: ${line}`);
    const categories = cats.split("|");
    const rand = rng(hash(ticker));

    await db.insert(stocks).values({ ticker, name, sector, categories }).onConflictDoNothing();

    // Price walk from a plausible base (₦15–₦850)
    const baseKobo = 1500 + Math.floor(rand() * 83500);
    const shares = 500_000_000 + Math.floor(rand() * 19_500_000_000);
    let px = baseKobo;
    const batch = dates.map((date) => {
      px = Math.max(100, Math.round(px * (1 + (rand() - 0.49) * 0.045)));
      const volume = Math.floor(100_000 + rand() * 4_900_000);
      return {
        ticker,
        date,
        openKobo: px,
        highKobo: Math.round(px * 1.01),
        lowKobo: Math.round(px * 0.99),
        closeKobo: px,
        volume,
        marketCapKobo: px * shares,
      };
    });
    for (let i = 0; i < batch.length; i += 100) {
      await db.insert(pricesDaily).values(batch.slice(i, i + 100)).onConflictDoNothing();
    }
    priceRows += batch.length;

    // One FY row tied to scale (P/E 4–12x, margin 10–35%)
    const mcap = px * shares;
    const pe = 4 + rand() * 8;
    const earnings = Math.round(mcap / pe);
    const margin = 0.1 + rand() * 0.25;
    const revenue = Math.round(earnings / margin);
    const paysDiv = categories.includes("dividend");
    await db
      .insert(financials)
      .values({
        id: `${ticker}-FY2025`,
        ticker,
        period: "FY2025",
        periodEnd: "2025-12-31",
        revenueKobo: revenue,
        earningsKobo: earnings,
        epsKobo: Math.round(earnings / shares),
        profitMargin: +margin.toFixed(3),
        roe: +(0.08 + rand() * 0.22).toFixed(3),
        roa: +(0.04 + rand() * 0.12).toFixed(3),
        debtToEquity: +(0.1 + rand() * 1.1).toFixed(2),
        fcfKobo: Math.round(earnings * (0.6 + rand() * 0.6)),
        payoutRatio: paysDiv ? +(0.2 + rand() * 0.5).toFixed(2) : +(rand() * 0.1).toFixed(2),
        source: "seed-sample",
      })
      .onConflictDoNothing();

    if (paysDiv) {
      const yieldPct = 0.03 + rand() * 0.06;
      await db
        .insert(dividends)
        .values({
          id: `${ticker}-DIV2025`,
          ticker,
          declDate: "2026-03-15",
          qualDate: "2026-04-20",
          payDate: "2026-05-10",
          dpsKobo: Math.round(baseKobo * yieldPct),
          yieldAtDecl: +yieldPct.toFixed(3),
        })
        .onConflictDoNothing();
    }
  }
  console.log(`Seeded ${rows.length} stocks, ${priceRows} price rows (source=seed-sample).`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
