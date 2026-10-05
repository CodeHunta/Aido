// Live NGX price fetcher (Phase 3.5).
// Feed: https://doclib.ngxgroup.com/REST/api/statistics/equities/ (same JSON the
// official price-list page uses; 30-min delayed). Imports the FULL listed
// universe (146 equities) with real OHLCV + sector + trade date.
// Run daily after close: pnpm --filter @aido/worker ngx
import { desc, eq } from "@aido/db/drizzle";
import { db, pricesDaily, stocks } from "@aido/db";
import type { IngestAdapter, PriceBar } from "./ingest";

const FEED = "https://doclib.ngxgroup.com/REST/api/statistics/equities/";

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
  JBERGER: "JBERGER",
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

const SECTOR_FIX: Record<string, string> = {
  "FINANCIAL SERVICES": "Financial Services",
  SERVICES: "Services",
  ICT: "ICT",
  "NATURAL RESOURCES": "Natural Resources",
  "OIL AND GAS": "Oil & Gas",
  "INDUSTRIAL GOODS": "Industrial Goods",
  "CONSTRUCTION/REAL ESTATE": "Construction/Real Estate",
  "CONSUMER GOODS": "Consumer Goods",
  CONGLOMERATES: "Conglomerates",
  HEALTHCARE: "Healthcare",
  AGRICULTURE: "Agriculture",
  UTILITIES: "Utilities",
  INVESTMENT: "Investment",
};

export interface FeedRow {
  Symbol: string;
  PrevClosingPrice: number | null;
  OpeningPrice: number | null;
  HighPrice: number | null;
  LowPrice: number | null;
  ClosePrice: number | null;
  Change: number | null;
  PercChange: number | null;
  Trades: number | null;
  Volume: number | null;
  Value: number | null;
  Market: string | null;
  Sector: string | null;
  Company2: string | null;
  TradeDate: string | null;
}

const TAPE_URL = "https://ngxgroup.com/exchange/data/equities-price-list/";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

async function downloadTape(retries = 3): Promise<string> {
  let last: unknown = null;
  for (let i = 0; i < retries; i++) {
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 60000);
      const res = await fetch(TAPE_URL, { headers: { "user-agent": UA }, signal: ctl.signal });
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

// Traded funds on the tape (no JSON feed). Kept as real price rows.
const ETF_LIST = ["NEWGOLD", "GREENWETF", "SIAMLETF40", "LOTUSHAL15", "STANBICETF30", "VETBANK", "VETGOODS", "VETGRIF30", "VETINDETF", "VSPBONDETF", "MERGROWTH", "MERVALUE"];

async function importEtfs(date: string): Promise<number> {
  let html = "";
  try {
    html = await downloadTape();
  } catch {
    console.log("[ngx] tape unreachable — ETFs skipped this run");
    return 0;
  }
  const found = parsePriceList(html);
  let n = 0;
  for (const sym of ETF_LIST) {
    const q = found.get(sym);
    if (!q) continue;
    const kobo = Math.round(q.priceNaira * 100);
    await db
      .insert(stocks)
      .values({ ticker: sym, name: sym, sector: "Investment", categories: [], ngxSymbol: sym, asset: "etf" })
      .onConflictDoNothing();
    await db
      .insert(pricesDaily)
      .values({ ticker: sym, date, openKobo: kobo, highKobo: kobo, lowKobo: kobo, closeKobo: kobo, volume: 0, marketCapKobo: null, source: "ngx-delayed" })
      .onConflictDoNothing();
    n++;
  }
  return n;
}

export async function fetchFeed(): Promise<FeedRow[]> {
  const all: FeedRow[] = [];
  for (let pageNo = 0; ; pageNo++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 60000);
    let rows: FeedRow[];
    try {
      const res = await fetch(`${FEED}?market=&sector=&orderby=&pageSize=500&pageNo=${pageNo}`, {
        headers: { "user-agent": UA, accept: "application/json" },
        signal: ctl.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      rows = (await res.json()) as FeedRow[];
    } finally {
      clearTimeout(t);
    }
    if (rows.length === 0) break;
    all.push(...rows);
    if (rows.length < 500) break;
  }
  return all;
}

export const sectorOf = (s: string | null) => (s && SECTOR_FIX[s]) || s || "Unknown";

export class NgxAdapter implements IngestAdapter {
  readonly name = "ngx-delayed";
  async fetchPrices(): Promise<PriceBar[]> {
    const rows = await fetchFeed();
    const date = (rows[0]?.TradeDate ?? new Date().toISOString()).slice(0, 10);
    const bars: PriceBar[] = [];
    for (const r of rows) {
      const close = r.ClosePrice ?? r.PrevClosingPrice;
      if (!r.Symbol || close == null) continue;
      const kobo = Math.round(close * 100);
      bars.push({
        ticker: r.Symbol,
        date,
        openKobo: r.OpeningPrice != null ? Math.round(r.OpeningPrice * 100) : kobo,
        highKobo: r.HighPrice != null ? Math.round(r.HighPrice * 100) : kobo,
        lowKobo: r.LowPrice != null ? Math.round(r.LowPrice * 100) : kobo,
        closeKobo: kobo,
        volume: r.Volume != null ? Math.round(r.Volume) : 0,
        marketCapKobo: 0,
      });
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

// Legacy tape parser (fallback only — the JSON feed above is primary).
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

async function main() {
  const rows = await fetchFeed();
  console.log(`[ngx] feed returned ${rows.length} equities`);
  const date = (rows[0]?.TradeDate ?? new Date().toISOString()).slice(0, 10);
  const byNgx = new Map<string, string>(Object.entries(SYMBOL_MAP).map(([a, b]) => [b, a]));
  let updated = 0;
  let added = 0;
  for (const r of rows) {
    if (!r.Symbol) continue;
    const close = r.ClosePrice ?? r.PrevClosingPrice;
    if (close == null) continue;
    const kobo = (n: number | null, fb: number) => (n != null ? Math.round(n * 100) : fb);
    const closeKobo = Math.round(close * 100);
    const ours = byNgx.get(r.Symbol);
    if (ours) {
      await db.update(stocks).set({ ngxSymbol: r.Symbol }).where(eq(stocks.ticker, ours));
      const prev = (await db.select().from(pricesDaily).where(eq(pricesDaily.ticker, ours)).orderBy(desc(pricesDaily.date)).limit(1))[0];
      await db
        .insert(pricesDaily)
        .values({
          ticker: ours,
          date,
          openKobo: kobo(r.OpeningPrice, closeKobo),
          highKobo: kobo(r.HighPrice, closeKobo),
          lowKobo: kobo(r.LowPrice, closeKobo),
          closeKobo,
          volume: r.Volume != null ? Math.round(r.Volume) : 0,
          marketCapKobo: prev?.marketCapKobo ?? null,
          source: "ngx-delayed",
        })
        .onConflictDoNothing();
      updated++;
    } else {
      const isReit = (r.Market ?? "").toLowerCase().includes("real estate");
      await db
        .insert(stocks)
        .values({ ticker: r.Symbol, name: (r.Company2 ?? r.Symbol).trim() || r.Symbol, sector: sectorOf(r.Sector), categories: [], ngxSymbol: r.Symbol, asset: isReit ? "reit" : "stock" })
        .onConflictDoNothing();
      await db
        .insert(pricesDaily)
        .values({
          ticker: r.Symbol,
          date,
          openKobo: kobo(r.OpeningPrice, closeKobo),
          highKobo: kobo(r.HighPrice, closeKobo),
          lowKobo: kobo(r.LowPrice, closeKobo),
          closeKobo,
          volume: r.Volume != null ? Math.round(r.Volume) : 0,
          marketCapKobo: null,
          source: "ngx-delayed",
        })
        .onConflictDoNothing();
      added++;
    }
  }
  console.log(`[ngx] date=${date} updated=${updated} added=${added}`);
  const etfs = await importEtfs(date);
  console.log(`[ngx] etfs=${etfs}`);
  console.log("[ngx] unmapped (delisted, sample data kept): WAPCO, FLOURMILL, MRS");
}

if (process.argv[1]?.endsWith("ngx.ts")) {
  main().then(
    () => process.exit(0),
    (e) => {
      console.error("[ngx] failed:", (e as Error).message ?? e);
      process.exit(1);
    },
  );
}
