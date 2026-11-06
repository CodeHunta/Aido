// Pulls real audited financial statements and dividends from NGX filings.
// Source: https://doclib.ngxgroup.com (the feed behind NGX Corporate Disclosures).
// Run: pnpm --filter @aido/worker fundamentals
//      pnpm --filter @aido/worker fundamentals -- --ticker=GTCO
//      pnpm --filter @aido/worker fundamentals -- --symbol=GTCO   (no DB needed)
import { and, desc, eq, gte, notInArray, or } from "@aido/db/drizzle";
import { db, dividends, financials, pricesDaily, stocks } from "@aido/db";
import { downloadPdf, fiscalYearOf, listFilings, periodEndFromText, periodEndOf, pickAnnualFilings } from "./fundamentals/filings";
import { pdfToText } from "./fundamentals/extract";
import { parseStatement, ratio, type Amounts, type ParsedStatement } from "./fundamentals/parse";

const SOURCE = "ngx-filing";
const SOURCE_TYPE = "filing-extracted";

interface Args {
  ticker?: string;
  symbol?: string;
  limit?: number;
  dry: boolean;
}

function parseArgs(): Args {
  const out: Args = { dry: false };
  for (const arg of process.argv.slice(2)) {
    const eq = arg.indexOf("=");
    const k = eq === -1 ? arg.replace(/^--/, "") : arg.slice(0, eq).replace(/^--/, "");
    const v = eq === -1 ? undefined : arg.slice(eq + 1);
    if (k === "ticker") out.ticker = v;
    if (k === "symbol") out.symbol = (v ?? "").toUpperCase();
    if (k === "limit") out.limit = Number(v);
    if (k === "dry") out.dry = true;
  }
  return out;
}

function epsReadings(candidate: ParsedStatement["epsCandidates"][number]): number[] {
  return candidate.unit === "kobo"
    ? [candidate.value]
    : candidate.unit === "naira"
      ? [candidate.value * 100]
      : [candidate.value, candidate.value * 100];
}

function resolveEps(
  candidates: ParsedStatement["epsCandidates"],
  ownersEarningsKobo: number | null,
  weightedShares: number | null,
  earningsKobo: number | null,
  priceKobo: number | null,
): number | null {
  // The accounting definition is profit divided by weighted average shares.
  // Owners' profit is the exact numerator, but some filings do not print that
  // row; total profit is a good proxy when there is no minority interest and
  // is still cross-checked against the printed EPS rows.
  const ownersUsable =
    ownersEarningsKobo != null &&
    ownersEarningsKobo >= 10_000_000 &&
    ownersEarningsKobo <= 100_000_000_000_000 &&
    earningsKobo != null &&
    Math.abs(ownersEarningsKobo) <= Math.abs(earningsKobo) * 10 + 100_000_000;
  const profitForEps =
    ownersUsable && ownersEarningsKobo! > 0
      ? ownersEarningsKobo
      : earningsKobo != null && earningsKobo > 0
        ? earningsKobo
        : null;
  const expected =
    profitForEps != null &&
    weightedShares != null &&
    weightedShares >= 10_000_000 &&
    weightedShares <= 1_000_000_000_000
      ? profitForEps / weightedShares
      : null;

  const pool = candidates.some((c) => c.unit != null)
    ? candidates.filter((c) => c.unit != null)
    : candidates;

  if (expected != null && expected >= 0.01 && expected <= 10_000) {
    let best: { kobo: number; diff: number } | null = null;
    for (const candidate of pool) {
      for (const reading of epsReadings(candidate)) {
        const kobo = Math.round(reading);
        if (kobo <= 0) continue;
        const diff = Math.abs(kobo - expected) / expected;
        if (diff <= 0.25 && (!best || diff < best.diff)) best = { kobo, diff };
      }
    }
    if (best) return best.kobo;
    // The printed rows contradict the reported profit and share count. Fall
    // through to the price check rather than trusting either blindly.
  }

  // Without an owners'-profit cross-check, fall back to the share price. A
  // filing often prints a contents-page number, a note reference, a
  // company-only column, and the group figure. Prefer the first reading whose
  // P/E is comfortably plausible. If the only candidates imply a very high
  // P/E, keep the first of those as a fallback: an expensive stock can be real,
  // but a page number usually loses to a later, cheaper row.
  let fallback: number | null = null;
  const seen: number[] = [];
  for (const candidate of pool) {
    for (const reading of epsReadings(candidate)) {
      const kobo = Math.round(reading);
      if (kobo <= 0) continue;
      seen.push(kobo);
      if (priceKobo && priceKobo > 0) {
        const pe = priceKobo / kobo;
        if (pe < 0.5 || pe > 200) continue;
        if (pe <= 120) return kobo;
        if (fallback == null) fallback = kobo;
        continue;
      }
      return kobo;
    }
  }
  // If every independent row agrees, trust that value even when the P/E is
  // extreme (a collapsed profit can make a real EPS look implausible).
  if (seen.length > 0) {
    const first = seen[0]!;
    if (seen.every((v) => Math.abs(v - first) <= Math.max(1, first * 0.02))) return first;
  }
  return fallback;
}

function shareCount(earningsKobo: number | null, epsKobo: number | null): number | null {
  if (!earningsKobo || !epsKobo || epsKobo <= 0) return null;
  const n = Math.round(earningsKobo / epsKobo);
  if (n < 50_000_000 || n > 5_000_000_000_000) return null;
  return n;
}

function resolveShares(
  totalEarningsKobo: number | null,
  ownersEarningsKobo: number | null,
  weightedShares: number | null,
  epsKobo: number | null,
): number | null {
  const sane = (n: number | null): number | null =>
    n != null && n >= 50_000_000 && n <= 5_000_000_000_000 ? n : null;
  const fromTotal = sane(shareCount(totalEarningsKobo, epsKobo));
  const fromOwners =
    ownersEarningsKobo != null && ownersEarningsKobo > 0 && epsKobo != null && epsKobo > 0
      ? sane(Math.round(ownersEarningsKobo / epsKobo))
      : null;
  const weighted = sane(weightedShares);
  const close = (a: number, b: number, tolerance: number): boolean =>
    Math.abs(a - b) / Math.max(a, b) <= tolerance;

  // The printed weighted average is the best source when it reconciles with
  // either profit measure. A share count taken from a different table (or a
  // different scale) is ignored.
  if (
    weighted != null &&
    ((fromOwners != null && close(weighted, fromOwners, 0.25)) ||
      (fromTotal != null && close(weighted, fromTotal, 0.25)))
  ) {
    return weighted;
  }
  return fromTotal ?? fromOwners ?? weighted;
}

function shiftYear(date: string, delta: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  dt.setUTCFullYear(dt.getUTCFullYear() + delta);
  return dt.toISOString().slice(0, 10);
}

interface YearRow {
  year: number;
  periodEnd: string;
  amounts: Amounts;
  epsCandidates: ParsedStatement["epsCandidates"];
  ownersEarningsKobo: number | null;
  weightedShares: number | null;
  dpsKobo: number | null;
  sourceUrl: string;
  filedAt: Date;
  isCurrent: boolean;
  unitLabel: string;
}

function collectRows(parsedByFiling: Array<{ parsed: ParsedStatement; url: string; filedAt: Date; year: number; periodEnd: string }>): Map<number, YearRow> {
  const byYear = new Map<number, YearRow>();
  // Oldest filing first, so an audited figure from its own year beats a
  // comparative column in the following year's report.
  for (const { parsed, url, filedAt, year, periodEnd } of [...parsedByFiling].sort((a, b) => a.year - b.year)) {
    byYear.set(year, {
      year,
      periodEnd,
      amounts: parsed.current,
      epsCandidates: parsed.epsCandidates,
      ownersEarningsKobo: parsed.ownersEarningsKobo,
      weightedShares: parsed.weightedShares,
      dpsKobo: parsed.dpsKobo,
      sourceUrl: url,
      filedAt,
      isCurrent: true,
      unitLabel: parsed.unit.label,
    });
    if (!byYear.has(year - 1)) {
      byYear.set(year - 1, {
        year: year - 1,
        periodEnd: shiftYear(periodEnd, -1),
        amounts: parsed.prior,
        epsCandidates: [],
        ownersEarningsKobo: null,
        weightedShares: null,
        dpsKobo: null,
        sourceUrl: url,
        filedAt,
        isCurrent: false,
        unitLabel: parsed.unit.label,
      });
    }
  }
  return byYear;
}

async function importTicker(ticker: string, symbol: string, args: Args): Promise<"ok" | "skipped" | "failed"> {
  const filings = await listFilings(symbol);
  const annual = pickAnnualFilings(filings, 2);
  if (annual.length === 0) {
    console.log(`[fundamentals] ${ticker}: no audited filing found (symbol ${symbol})`);
    return "skipped";
  }

  const parsedByFiling: Array<{ parsed: ParsedStatement; url: string; filedAt: Date; year: number; periodEnd: string }> = [];
  // A network failure, a scanned PDF, or an undated filing means we could not
  // read that document this run. We must not treat that gap as proof that the
  // figures are wrong, or a flaky connection would wipe good rows.
  let transient = false;
  for (const filing of annual) {
    const year = fiscalYearOf(filing.description);
    if (!year) {
      console.log(`[fundamentals] ${ticker}: cannot date "${filing.description}"`);
      transient = true;
      continue;
    }
    // Only trust a date printed in the description; otherwise read it from the
    // report. periodEndOf() otherwise assumes 31 December, which is wrong for
    // companies with a March, April, May or June year end.
    const descriptionEnd = periodEndOf(filing.description, null);
    try {
      const pdf = await downloadPdf(filing.url);
      const text = await pdfToText(pdf);
      if (text.trim().length < 2000) {
        console.log(`[fundamentals] ${ticker} FY${year}: no text layer (scanned?)`);
        transient = true;
        continue;
      }
      const periodEnd = descriptionEnd ?? periodEndFromText(text, year);
      if (!periodEnd) {
        console.log(`[fundamentals] ${ticker} FY${year}: cannot find the period end in the report`);
        transient = true;
        continue;
      }
      const parsed = parseStatement(text);
      console.log(
        `[fundamentals] ${ticker} FY${year}: unit=${parsed.unit.label} rev=${parsed.current.revenueKobo} pat=${parsed.current.earningsKobo} owners=${parsed.ownersEarningsKobo} shares=${parsed.weightedShares} eps=${parsed.epsRaw} dps=${parsed.dpsKobo} ${parsed.warnings.join(",")}`,
      );
      if (!parsed.unit.confident) {
        console.log(`[fundamentals] ${ticker} FY${year}: unit not detected, skipping to avoid a 1000x error`);
        continue;
      }
      if (parsed.current.revenueKobo == null && parsed.current.earningsKobo == null) {
        console.log(`[fundamentals] ${ticker} FY${year}: no revenue or earnings found, skipping`);
        continue;
      }
      parsedByFiling.push({ parsed, url: filing.url, filedAt: filing.created, year, periodEnd });
    } catch (e) {
      console.log(`[fundamentals] ${ticker} FY${year}: ${(e as Error).message}`);
      transient = true;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  const rows = collectRows(parsedByFiling);
  if (rows.size === 0) {
    // The filings were readable and still produced nothing usable: any earlier
    // figures are no longer supported, so clear them. A transient failure is
    // different — it leaves the previous rows in place.
    if (!args.dry && !transient && annual.length > 0) {
      await db.delete(financials).where(and(eq(financials.ticker, ticker), eq(financials.source, SOURCE)));
      await db.delete(dividends).where(and(eq(dividends.ticker, ticker), eq(dividends.sourceType, SOURCE_TYPE)));
    }
    return "failed";
  }

  const price = args.dry
    ? null
    : (await db.select().from(pricesDaily).where(eq(pricesDaily.ticker, ticker)).orderBy(desc(pricesDaily.date)).limit(1))[0]?.closeKobo ?? null;

  let written = 0;
  for (const row of [...rows.values()].sort((a, b) => a.year - b.year)) {
    const { amounts } = row;
    if (!amounts.revenueKobo && !amounts.earningsKobo) continue;
    if (row.isCurrent && !amounts.earningsKobo && !amounts.revenueKobo) continue;

    // If the profit row did not survive parsing, the EPS printed beside it may
    // be in another currency or scale. Leave both unavailable.
    const epsKobo =
      amounts.earningsKobo == null || amounts.earningsKobo <= 0
        ? null
        : resolveEps(
            row.epsCandidates,
            row.ownersEarningsKobo,
            row.weightedShares,
            amounts.earningsKobo,
            price,
          );
    const shares = resolveShares(
      amounts.earningsKobo,
      row.ownersEarningsKobo,
      row.weightedShares,
      epsKobo,
    );
    const fcf = amounts.operatingCashFlowKobo != null
      ? amounts.operatingCashFlowKobo - Math.abs(amounts.capexKobo ?? 0)
      : null;

    const values = {
      id: `${ticker}-FY${row.year}`,
      ticker,
      period: `FY${row.year}`,
      periodEnd: row.periodEnd,
      fiscalYear: row.year,
      periodType: "FY",
      currency: "NGN",
      source: SOURCE,
      sourceType: SOURCE_TYPE,
      sourceUrl: row.sourceUrl,
      filedAt: row.filedAt,
      verifiedAt: new Date(),
      revenueKobo: amounts.revenueKobo,
      earningsKobo: amounts.earningsKobo,
      epsKobo,
      profitMargin: ratio(amounts.earningsKobo, amounts.revenueKobo),
      roe: ratio(amounts.earningsKobo, amounts.totalEquityKobo),
      roa: ratio(amounts.earningsKobo, amounts.totalAssetsKobo),
      debtToEquity: ratio(amounts.totalDebtKobo, amounts.totalEquityKobo),
      fcfKobo: fcf,
      payoutRatio: ratio(row.dpsKobo, epsKobo),
      sharesOutstanding: shares,
      totalAssetsKobo: amounts.totalAssetsKobo,
      totalEquityKobo: amounts.totalEquityKobo,
      totalDebtKobo: amounts.totalDebtKobo,
      cashKobo: amounts.cashKobo,
      operatingCashFlowKobo: amounts.operatingCashFlowKobo,
      capexKobo: amounts.capexKobo,
      updatedAt: new Date(),
    };

    if (args.dry) {
      console.log(`[fundamentals] would write ${values.id}`, JSON.stringify({ ...values, verifiedAt: undefined, updatedAt: undefined }));
      written++;
      continue;
    }

    await db
      .insert(financials)
      .values(values)
      .onConflictDoUpdate({
        target: financials.id,
        set: {
          periodEnd: values.periodEnd,
          fiscalYear: values.fiscalYear,
          source: values.source,
          sourceType: values.sourceType,
          sourceUrl: values.sourceUrl,
          filedAt: values.filedAt,
          verifiedAt: values.verifiedAt,
          revenueKobo: values.revenueKobo,
          earningsKobo: values.earningsKobo,
          epsKobo: values.epsKobo,
          profitMargin: values.profitMargin,
          roe: values.roe,
          roa: values.roa,
          debtToEquity: values.debtToEquity,
          fcfKobo: values.fcfKobo,
          payoutRatio: values.payoutRatio,
          sharesOutstanding: values.sharesOutstanding,
          totalAssetsKobo: values.totalAssetsKobo,
          totalEquityKobo: values.totalEquityKobo,
          totalDebtKobo: values.totalDebtKobo,
          cashKobo: values.cashKobo,
          operatingCashFlowKobo: values.operatingCashFlowKobo,
          capexKobo: values.capexKobo,
          updatedAt: values.updatedAt,
        },
      });
    written++;

    if (row.dpsKobo != null) {
      await db
        .insert(dividends)
        .values({
          id: `${ticker}-FY${row.year}`,
          ticker,
          period: `FY${row.year}`,
          dpsKobo: row.dpsKobo,
          declDate: null,
          qualDate: null,
          payDate: null,
          yieldAtDecl: null,
          currency: "NGN",
          status: "declared",
          sourceType: SOURCE_TYPE,
          sourceUrl: row.sourceUrl,
          verifiedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: dividends.id,
          set: {
            period: `FY${row.year}`,
            dpsKobo: row.dpsKobo,
            sourceType: SOURCE_TYPE,
            sourceUrl: row.sourceUrl,
            verifiedAt: new Date(),
          },
        });
    } else {
      // A previous run may have stored a dividend this parse can no longer
      // support. Remove it rather than leave a figure the source does not
      // justify.
      await db
        .delete(dividends)
        .where(
          and(
            eq(dividends.ticker, ticker),
            eq(dividends.period, `FY${row.year}`),
            eq(dividends.sourceType, SOURCE_TYPE),
          ),
        );
    }
  }

  // Real rows replace the placeholder ones for this ticker. Sample rows are
  // never mixed into live scoring or the UI. Rows from an earlier import that
  // are no longer backed by one of the filings just parsed are removed, so a
  // wrong annual pick cannot survive a corrected re-run.
  if (!args.dry && written > 0) {
    if (!transient) {
      const keepUrls = [...new Set(parsedByFiling.map((p) => p.url))];
      const keepYears = [...new Set([...rows.values()].map((r) => r.year))];
      const keepPeriods = keepYears.map((y) => `FY${y}`);
      const oldestYear = Math.min(...keepYears);
      if (keepUrls.length > 0) {
        await db
          .delete(financials)
          .where(
            and(
              eq(financials.ticker, ticker),
              eq(financials.source, SOURCE),
              gte(financials.fiscalYear, oldestYear),
              or(
                notInArray(financials.sourceUrl, keepUrls),
                notInArray(financials.fiscalYear, keepYears),
              ),
            ),
          );
        await db
          .delete(dividends)
          .where(
            and(
              eq(dividends.ticker, ticker),
              eq(dividends.sourceType, SOURCE_TYPE),
              gte(dividends.period, `FY${oldestYear}`),
              notInArray(dividends.period, keepPeriods),
            ),
          );
      }
    }
    await db.delete(financials).where(and(eq(financials.ticker, ticker), eq(financials.sourceType, "seed-sample")));
    await db.delete(dividends).where(and(eq(dividends.ticker, ticker), eq(dividends.sourceType, "seed-sample")));
  }

  console.log(`[fundamentals] ${ticker}: wrote ${written} period(s) from ${annual.length} filing(s)`);
  return written > 0 ? "ok" : "failed";
}

async function main() {
  const args = parseArgs();

  if (args.symbol) {
    const filings = await listFilings(args.symbol);
    const annual = pickAnnualFilings(filings, 2);
    console.log(`[fundamentals] ${args.symbol}: ${filings.length} statements, ${annual.length} audited`);
    for (const filing of annual) {
      const year = fiscalYearOf(filing.description);
      console.log(`\n== FY${year} ${filing.description}\n${filing.url}`);
      const pdf = await downloadPdf(filing.url);
      const text = await pdfToText(pdf);
      console.log(`chars=${text.length}`);
      console.log(JSON.stringify(parseStatement(text), null, 1));
    }
    return;
  }

  const all = await db.select().from(stocks);
  const wanted = args.ticker ? new Set(args.ticker.split(/[\s,]+/).filter(Boolean).map((t) => t.toUpperCase())) : null;
  const targets = all
    .filter((s) => (s.asset ?? "stock") === "stock")
    .filter((s) => (wanted ? wanted.has(s.ticker) : true))
    .slice(0, args.limit ?? undefined);

  console.log(`[fundamentals] ${targets.length} ticker(s)`);
  let ok = 0;
  let skipped = 0;
  let failed = 0;
  for (const stock of targets) {
    const symbol = stock.ngxSymbol || stock.ticker;
    try {
      const result = await importTicker(stock.ticker, symbol, args);
      if (result === "ok") ok++;
      else if (result === "skipped") skipped++;
      else failed++;
    } catch (e) {
      failed++;
      console.log(`[fundamentals] ${stock.ticker}: ${(e as Error).message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`[fundamentals] done ok=${ok} skipped=${skipped} failed=${failed}`);
}

if (process.argv[1]?.endsWith("fundamentals.ts")) {
  main().then(
    () => process.exit(0),
    (e) => {
      console.error("[fundamentals] failed:", (e as Error).message ?? e);
      process.exit(1);
    },
  );
}
