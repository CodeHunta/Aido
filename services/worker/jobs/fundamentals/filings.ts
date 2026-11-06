// NGX corporate-disclosure feed (the same SharePoint list the public
// Corporate Disclosures page reads). Free, public, no key required.

const BASE = "https://doclib.ngxgroup.com/_api/Web/Lists/GetByTitle('XFinancial_News')/items";
const HEADERS = { accept: "application/json;odata=verbose", "user-agent": "Mozilla/5.0 (compatible; Aido/0.1)" };

export interface Filing {
  url: string;
  description: string;
  created: Date;
  type: string;
}

interface RawRow {
  URL?: { Description?: string; Url?: string };
  Created?: string;
  Type_of_Submission?: string;
}

async function getJson(url: string, retries = 3): Promise<{ d: { results: RawRow[] } }> {
  let last: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as { d: { results: RawRow[] } };
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw last;
}

export async function listFilings(symbol: string, submission = "Financial Statements "): Promise<Filing[]> {
  const filter = encodeURIComponent(`CompanySymbol eq '${symbol}' and Type_of_Submission eq '${submission}'`);
  const url = `${BASE}?$select=URL,Created,Type_of_Submission&$filter=${filter}&$orderby=Created desc&$top=40`;
  const json = await getJson(url);
  return json.d.results
    .filter((r) => r.URL?.Url && r.URL.Description)
    .map((r) => ({
      url: r.URL!.Url!,
      description: r.URL!.Description!,
      created: new Date(r.Created ?? 0),
      type: r.Type_of_Submission ?? submission,
    }));
}

// "AUDITED" must be a whole word: NGX quarterlies often say "UNAUDITED", and a
// substring match would promote them to annual statements. "QUARTER 5" is the
// NGX label for a full-year filing; quarters 1-4 and half-years are not.
const ANNUAL = /(?:\baudited\b|annual report|full[\s-]*year|\bfy\s*\d{4}\b|quarter\s*5\b)/i;
const NOT_ANNUAL =
  /unaudited|\bq[1-4]\b|quarter\s*[1-4]\b|half[\s-]*year|\bh1\b|interim|nine[\s-]*months?|\b[1-3]\s*months?\b/i;

/** Latest audited full-year statements, newest first, one per fiscal year. */
export function pickAnnualFilings(filings: Filing[], limit = 2): Filing[] {
  const annual = filings.filter((f) => ANNUAL.test(f.description) && !NOT_ANNUAL.test(f.description));
  const seen = new Set<string>();
  const out: Filing[] = [];
  for (const f of annual) {
    const year = fiscalYearOf(f.description);
    const key = year ? String(year) : f.description;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
    if (out.length >= limit) break;
  }
  return out;
}

export function fiscalYearOf(description: string): number | null {
  const ended = description.match(/year\s+ended\s+.*?(\d{4})/i);
  if (ended) return Number(ended[1]);
  const fy = description.match(/FY\s*(\d{4})/i);
  if (fy) return Number(fy[1]);
  const any = description.match(/\b(20\d{2})\b/);
  return any ? Number(any[1]) : null;
}

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

/** Period end from the filing description, falling back to 31 December of the fiscal year. */
export function periodEndOf(description: string, fiscalYear: number | null): string | null {
  const m = description.match(
    /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/i,
  );
  if (m) {
    const day = String(Number(m[1])).padStart(2, "0");
    const month = String(MONTHS.indexOf(m[2]!.toLowerCase()) + 1).padStart(2, "0");
    return `${m[3]}-${month}-${day}`;
  }
  if (fiscalYear) return `${fiscalYear}-12-31`;
  return null;
}

/**
 * The NGX description often says only "FINANCIAL STATEMENT FOR 2024", which is
 * the filing year, not the accounting date. Non-December year ends (Flour Mills,
 * Guinness, Cutix, PZ, Honeywell) must come from the report itself.
 */
export function periodEndFromText(text: string, fiscalYear: number | null): string | null {
  const months = MONTHS.join("|");
  const head = text.slice(0, 12_000);
  const mk = (day: string, month: string, year: string) => {
    const d = String(Number(day)).padStart(2, "0");
    const mo = String(MONTHS.indexOf(month.toLowerCase()) + 1).padStart(2, "0");
    return `${year}-${mo}-${d}`;
  };
  const dayFirst = head.match(
    new RegExp(`(?:ended?|as\\s+at|at)\\s*:?\\s*(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${months})\\s*,?\\s*(\\d{4})`, "i"),
  );
  if (dayFirst) return mk(dayFirst[1]!, dayFirst[2]!, dayFirst[3]!);
  const monthFirst = head.match(
    new RegExp(`(?:ended?|as\\s+at|at)\\s*:?\\s*(${months})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\s*,?\\s*(\\d{4})`, "i"),
  );
  if (monthFirst) return mk(monthFirst[2]!, monthFirst[1]!, monthFirst[3]!);
  if (fiscalYear) return `${fiscalYear}-12-31`;
  return null;
}

export async function downloadPdf(url: string, retries = 3): Promise<Uint8Array> {
  let last: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "user-agent": HEADERS["user-agent"] } });
      if (!res.ok) throw new Error(`download HTTP ${res.status}`);
      const type = res.headers.get("content-type") ?? "";
      const buf = new Uint8Array(await res.arrayBuffer());
      if (!type.includes("pdf") && buf[0] !== 0x25) throw new Error(`not a PDF (${type})`);
      return buf;
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
    }
  }
  throw last;
}
