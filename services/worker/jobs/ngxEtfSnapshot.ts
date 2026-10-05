import { readFileSync } from "node:fs";
import { db, pricesDaily, stocks } from "@aido/db";
import { parsePriceList } from "./ngx";

const ETF_LIST = ["NEWGOLD", "GREENWETF", "SIAMLETF40", "LOTUSHAL15", "STANBICETF30", "VETBANK", "VETGOODS", "VETGRIF30", "VETINDETF", "VSPBONDETF", "MERGROWTH", "MERVALUE"];

async function main() {
  const html = readFileSync("C:/Users/USER/AppData/Local/Temp/opencode/ngx3.html", "utf8");
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
      .values({ ticker: sym, date: "2026-09-28", openKobo: kobo, highKobo: kobo, lowKobo: kobo, closeKobo: kobo, volume: 0, marketCapKobo: null, source: "ngx-delayed" })
      .onConflictDoNothing();
    n++;
  }
  console.log(`[ngx-etf-snapshot] imported=${n}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
