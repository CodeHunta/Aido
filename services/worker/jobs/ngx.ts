// Live NGX price fetcher (Phase 3.5).
// Source: https://ngxgroup.com/exchange/data/equities-price-list/ (30-min delayed).
// Appends one real price bar per mapped ticker per trading day. History before
// today stays seed-sample until real days accumulate — charts and scores use
// the latest row automatically. Run daily after close:
//   pnpm --filter @aido/worker ngx
import { desc, eq } from "drizzle-orm";
import { db, pricesDaily, stocks } from "@aido/db";
import type { IngestAdapter, PriceBar } from "./ingest";

const URL = "https://ngxgroup.com/exchange/data/equities-price-list/";

// Our ticker -> official NGX symbol. Three delisted names have no live symbol
// (WAPCO, FLOURMILL, MRS) and keep clearly-marked sample data.
export const SYMBOL_MAP: Record<string, string> = {
  GTCO: "GTCO",
  ZENITH: "ZENITHBANK",
  UBA: "UBA",
  ACCESSCORP: "ACCESSCORP",
  FBNH: "FIRSTHOLDCO",
  STERLING: "STERLINGNG",
  FCMB: "FCMB",
  FIDELITY: "FIDELITYBK",
  WEMA: "WEMABANK",
  JAIZ: "JAIZBANK",
  ETI: "ETI",
  DANGCEM: "DANGCEM",
  BUACEMENT: "BUACEMENT",
  BERGER: "JBERGER",
  CUTIX: "CUTIX",
  NB: "NB",
  GUINNESS: "GUINNESS",
  INTBREW: "INTBREW",
  NESTLE: "NESTLE",
  UNILEVER: "UNILEVER",
  PZ: "PZ",
  CADBURY: "CADBURY",
  DANGSUGAR: "DANGSUGAR",
  NASCON: "NASCON",
  BUAFOODS: "BUAFOODS",
  HONEYWELL: "HONYFLOUR",
  MTNN: "MTNN",
  AIRTELAFRI: "AIRTELAFRI",
  SEPLAT: "SEPLAT",
  TOTAL: "TOTAL",
  OANDO: "OANDO",
  CONOIL: "CONOIL",
  TRANSCORP: "TRANSCORP",
  TRANSCOHOT: "TRANSCOHOT",
  UACN: "UACN",
  AIICO: "AIICO",
  CUSTODIAN: "CUSTODIAN",
  PRESCO: "PRESCO",
  OKOMUOIL: "OKOMUOIL",
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function download(retries = 3): Promise<string> {
  let last: unknown = null;
  for (let i = 0; i < retries; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 60000);
      const res = await fetch(URL, { headers: { "user-agent": UA }, signal: ctl.signal });
      clearTimeout(t);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw last;
}

// symbol=XXX ... N12.34 ... 0.5 %  (tags may sit between price and change)
export function parsePriceList(html: string): Map<string, { priceNaira: number; changePct: number }> {
  const out = new Map<string, { priceNaira: number; changePct: number }>();
  const re = /symbol=([A-Z0-9]+).*?N([\d,]+\.\d+).*?(-?[\d.]+)\s*%/gs;
  for (const m of html.matchAll(re)) {
    const sym = m[1]!;
    if (out.has(sym)) continue;
    out.set(sym, { priceNaira: Number(m[2]!.replace(/,/g, "")), changePct: Number(m[3]) });
  }
  return out;
}

function tradingDate(d = new Date()): string {
  const t = new Date(d);
  while (t.getDay() === 0 || t.getDay() === 6) t.setDate(t.getDate() - 1);
  return t.toISOString().slice(0, 10);
}

export class NgxAdapter implements IngestAdapter {
  readonly name = "ngx-delayed";
  async fetchPrices(): Promise<PriceBar[]> {
    const html = await download();
    const found = parsePriceList(html);
    const date = tradingDate();
    const bars: PriceBar[] = [];
    for (const [ticker, ngx] of Object.entries(SYMBOL_MAP)) {
      const q = found.get(ngx);
      if (!q) continue;
      const kobo = Math.round(q.priceNaira * 100);
      bars.push({ ticker, date, openKobo: kobo, highKobo: kobo, lowKobo: kobo, closeKobo: kobo, volume: 0, marketCapKobo: 0 });
    }
    return bars;
  }
  async fetchFinancials() {
    return [];
  }
  async fetchDividends() {
    return [];
  }
}

async function main() {
  const html = await download();
  const found = parsePriceList(html);
  console.log(`[ngx] read ${found.size} symbols from NGX (30-min delayed)`);
  const date = tradingDate();
  let updated = 0;
  const missing: string[] = [];
  for (const [ticker, ngx] of Object.entries(SYMBOL_MAP)) {
    const q = found.get(ngx);
    if (!q) {
      missing.push(`${ticker}(${ngx})`);
      continue;
    }
    await db.update(stocks).set({ ngxSymbol: ngx }).where(eq(stocks.ticker, ticker));
    const prev = (await db.select().from(pricesDaily).where(eq(pricesDaily.ticker, ticker)).orderBy(desc(pricesDaily.date)).limit(1))[0];
    const kobo = Math.round(q.priceNaira * 100);
    await db
      .insert(pricesDaily)
      .values({
        ticker,
        date,
        openKobo: kobo,
        highKobo: kobo,
        lowKobo: kobo,
        closeKobo: kobo,
        volume: 0,
        marketCapKobo: prev?.marketCapKobo ?? null,
        source: "ngx-delayed",
      })
      .onConflictDoNothing();
    updated++;
  }
  console.log(`[ngx] date=${date} updated=${updated} missing=${missing.length ? missing.join(",") : "none"}`);
  console.log("[ngx] unmapped (delisted, sample data kept): WAPCO, FLOURMILL, MRS");
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error("[ngx] failed:", (e as Error).message ?? e);
    process.exit(1);
  },
);
