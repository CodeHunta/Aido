// Pure text parsing for NGX financial-statement PDFs.
// No I/O here so the logic can be exercised against saved filings.

export interface Unit {
  multiplier: number;
  label: string;
  confident: boolean;
}

export interface Amounts {
  revenueKobo: number | null;
  earningsKobo: number | null;
  totalAssetsKobo: number | null;
  totalEquityKobo: number | null;
  cashKobo: number | null;
  operatingCashFlowKobo: number | null;
  capexKobo: number | null;
  totalDebtKobo: number | null;
}

export interface EpsCandidate {
  value: number;
  unit: "kobo" | "naira" | null;
  /** Position of the label in the document, so callers can prefer earlier rows. */
  at: number;
}

export interface ParsedStatement {
  unit: Unit;
  current: Amounts;
  prior: Amounts;
  epsRaw: number | null;
  epsUnitHint: "kobo" | "naira" | null;
  /** Every plausible EPS row in document order. Only a few survive the P/E check. */
  epsCandidates: EpsCandidate[];
  /** Profit attributable to the owners of the parent, used to validate EPS. */
  ownersEarningsKobo: number | null;
  /** Weighted average shares used for EPS, already scaled to whole shares. */
  weightedShares: number | null;
  dpsKobo: number | null;
  warnings: string[];
}

const MONEY = /\(?\s*-?\s*\d[\d,]*(?:\.\d+)?\s*\)?/g;

export function normalize(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u201c\u201d/g, '"')
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ");
}

/** Turn "1,234.5" / "(1,234)" / "-" into a number. */
export function toNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t || t === "-" || t === "--" || t === "nil") return null;
  const negative = t.startsWith("(") && t.endsWith(")");
  const cleaned = t.replace(/[(),\s]/g, "").replace(/^-/, "");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

const MONTH_AFTER =
  /^\s*(?:january|february|march|april|may|june|july|august|september|october|november|december)\b/i;

/** Numbers on a line, ignoring percentages, years and note references where possible. */
export function numbersIn(s: string): number[] {
  const out: number[] = [];
  for (const m of s.matchAll(MONEY)) {
    const raw = m[0];
    const after = s.slice(m.index! + raw.length, m.index! + raw.length + 14);
    if (after.trimStart().startsWith("%")) continue;
    // "31 December 2025" is a date header, not a monetary amount.
    if (MONTH_AFTER.test(after)) continue;
    const n = toNumber(raw);
    if (n == null) continue;
    const clean = raw.replace(/[(),\s]/g, "");
    const hasComma = raw.includes(",") || raw.includes(".");
    // Column headers repeat the year; a bare 4-digit year is never a value.
    if (!hasComma && n >= 1900 && n <= 2100) continue;
    // A bare 3-digit integer at the start of a row is usually a note number.
    if (!hasComma && Math.abs(n) < 1000 && /^\s*-?\d{1,3}\s*$/.test(raw)) continue;
    out.push(n);
    if (out.length >= 8) break;
    void clean;
  }
  return out;
}

/**
 * Find the first row whose label matches, returning its first two numeric columns.
 * `preferWindow` restricts the search to the statement section when available.
 */
export function row(
  text: string,
  haystack: string,
  labels: string[],
  preferWindow?: [number, number],
  lookBack = 0,
  notFollowedBy?: RegExp,
  byPosition = false,
): { values: number[]; raw: string } | null {
  const scopes: Array<[number, number]> = [];
  if (preferWindow && preferWindow[1] > preferWindow[0]) scopes.push(preferWindow);
  scopes.push([0, haystack.length]);

  const readAt = (label: string, i: number): { values: number[]; raw: string } | null => {
    const start = text.lastIndexOf("\n", i) + 1;
    let end = text.indexOf("\n", i + label.length);
    if (end === -1) end = Math.min(text.length, i + label.length + 240);
    const line = text.slice(start, end);
    const offset = i - start + label.length;
    if (notFollowedBy && notFollowedBy.test(line.slice(offset))) return null;
    let values = numbersIn(line.slice(Math.max(0, offset)));
    let raw = line;

    if (values.length === 0) {
      // Wrapped rows: value sits on the following line.
      const nextEnd = text.indexOf("\n", end + 1);
      const next = text.slice(end + 1, nextEnd === -1 ? Math.min(text.length, end + 240) : nextEnd);
      values = numbersIn(next);
      if (values.length > 0) raw = `${line} / ${next}`;
    }
    if (values.length === 0 && lookBack > 0 && start > 0) {
      // Some cash-flow totals are emitted a line or two before their label.
      let cursor = start;
      for (let k = 0; k < lookBack && cursor > 0; k++) {
        const prevStart = text.lastIndexOf("\n", cursor - 2) + 1;
        const prev = text.slice(prevStart, cursor);
        const found = numbersIn(prev);
        if (found.length > 0) {
          values = found;
          raw = `${prev} / ${line}`;
          break;
        }
        cursor = prevStart;
      }
    }
    return { values, raw };
  };

  // A single number is often narrative ("revenue ... ₦172,6 billion") or a
  // note reference. Real statement rows carry current and prior columns, so
  // prefer a two-value match and only fall back to a one-value match.
  let fallback: { values: number[]; raw: string } | null = null;

  for (const [from, to] of scopes) {
    if (byPosition) {
      // Label order is a preference, but a later label can be the real line
      // ("Profit after tax") while an earlier label first matches the statement
      // of changes in equity ("Profit for the year"). Take the first match in
      // document order instead.
      let best: { values: number[]; raw: string } | null = null;
      let bestAt = Infinity;
      for (const label of labels) {
        const needle = label.toLowerCase();
        let i = haystack.indexOf(needle, from);
        while (i !== -1 && i < to) {
          const cand = readAt(label, i);
          if (cand && cand.values.length >= 2 && i < bestAt) {
            best = cand;
            bestAt = i;
          } else if (cand && cand.values.length === 1 && !fallback) {
            fallback = cand;
          }
          i = haystack.indexOf(needle, i + needle.length);
        }
      }
      if (best) return best;
      continue;
    }

    for (const label of labels) {
      const needle = label.toLowerCase();
      let i = haystack.indexOf(needle, from);
      while (i !== -1 && i < to) {
        const cand = readAt(label, i);
        if (cand && cand.values.length >= 2) return cand;
        if (cand && cand.values.length === 1 && !fallback) fallback = cand;
        i = haystack.indexOf(needle, i + needle.length);
      }
    }
  }
  return fallback;
}

const UNIT_PATTERNS: Array<[RegExp, number, string]> = [
  [
    /(?<![a-z])(?:ngn|₦|n)\s*['’]?\s*(?:000|thousand)\b|['’]\s*thousand|in thousands|thousands of naira/,
    1e3,
    "thousands",
  ],
  [
    /(?<![a-z])(?:ngn|₦|n)\s*['’]?\s*(?:m|million)\b|['’]\s*million|in millions|millions of naira/,
    1e6,
    "millions",
  ],
  [
    /(?<![a-z])(?:ngn|₦|n)\s*['’]?\s*(?:bn|billion)\b|['’]\s*billion|in billions|billions of naira/,
    1e9,
    "billions",
  ],
];

/**
 * Detect the reporting unit. The same document can mix units (a fraud table in
 * ₦'000, the accounts in millions), so when we know where the balance sheet is
 * we pick the marker closest to it instead of the first marker in the file.
 */
export function detectUnit(text: string, anchor = 0): Unit {
  const from = anchor > 0 ? Math.max(0, anchor - 60_000) : 0;
  const to = anchor > 0 ? Math.min(text.length, anchor + 25_000) : Math.min(text.length, 120_000);
  const scope = text.slice(from, to).toLowerCase();
  const found: Array<{ index: number; multiplier: number; label: string }> = [];
  for (const [re, multiplier, label] of UNIT_PATTERNS) {
    for (const m of scope.matchAll(new RegExp(re.source, "gi"))) {
      found.push({ index: from + (m.index ?? 0), multiplier, label });
    }
  }
  if (found.length === 0) return { multiplier: 1, label: "units", confident: false };
  if (anchor > 0) {
    found.sort((a, b) => Math.abs(a.index - anchor) - Math.abs(b.index - anchor));
    const best = found[0]!;
    if (Math.abs(best.index - anchor) < 25_000) {
      return { multiplier: best.multiplier, label: best.label, confident: true };
    }
  }
  // Without a clear anchor, keep the old priority: the first specific marker.
  for (const [re, multiplier, label] of UNIT_PATTERNS) {
    if (re.test(scope)) return { multiplier, label, confident: true };
  }
  return { multiplier: 1, label: "units", confident: false };
}

function section(
  text: string,
  headers: string[],
  size = 30_000,
  verify?: (text: string, at: number) => boolean,
): [number, number] | undefined {
  const lower = text.toLowerCase();
  for (const h of headers) {
    const needle = h.toLowerCase();
    let i = lower.indexOf(needle);
    let fallback: number | null = null;
    while (i >= 0) {
      const lineEnd = (() => {
        const e = text.indexOf("\n", i);
        return e === -1 ? text.length : e;
      })();
      // A contents-page entry repeats the heading and ends with a page number
      // ("Statement of profit or loss for the year 28"). Anchoring there puts
      // the window in the front matter instead of the real statement.
      const rest = text.slice(i + needle.length, lineEnd);
      const trimmed = rest.trim();
      const noLetters = /\d/.test(rest) && !/[a-z]/i.test(rest);
      // A real heading may end with the year ("... 31 December 2025"); a
      // contents entry ends with a short page number ("... for the year 28").
      const endsWithPage = /(?:^|\s)\d{1,3}$/.test(trimmed);
      const isContents = noLetters || endsWithPage;
      if (!isContents) {
        if (verify && verify(text, i)) return [i, Math.min(lower.length, i + size)];
        if (fallback == null) fallback = i;
      }
      i = lower.indexOf(needle, i + needle.length);
    }
    if (fallback != null) return [fallback, Math.min(lower.length, fallback + size)];
  }
  return undefined;
}

/** True when a real income-statement row follows the heading soon after. */
function hasIncomeRows(text: string, at: number, span = 4_000): boolean {
  const chunk = text.slice(at, Math.min(text.length, at + span));
  let revenue = false;
  let profit = false;
  for (const line of chunk.split("\n")) {
    const l = line.toLowerCase();
    const r = l.indexOf("revenue");
    if (!revenue && r >= 0 && numbersIn(line.slice(r + 7)).filter((n) => Math.abs(n) >= 1000).length >= 2) {
      revenue = true;
    }
    const p = l.indexOf("profit");
    if (!profit && p >= 0 && numbersIn(line.slice(p + 6)).filter((n) => Math.abs(n) >= 1000).length >= 2) {
      profit = true;
    }
    if (revenue && profit) return true;
  }
  return false;
}

function kobo(values: number[] | undefined, unit: Unit, index: number): number | null {
  if (!values || values[index] == null) return null;
  return Math.round(values[index]! * unit.multiplier * 100);
}

const REVENUE = [
  "gross earnings",
  "gross earning",
  "total revenue",
  "revenue",
  "turnover",
  "total income",
];
const PBT = [
  "profit before income tax",
  "profit before tax",
  "profit/(loss) before tax",
  "profit before taxation",
  "loss before tax",
];
const PAT = [
  "profit for the year",
  "profit/(loss) for the year",
  "profit/ (loss) for the year",
  "profit / (loss) for the year",
  "profit or(loss) for the year",
  "profit/(loss) for the period",
  "profit for the period",
  "profit after tax",
  "profit/(loss) after tax",
  "profit/ (loss) after tax",
  "profit / (loss) after tax",
  "profit/(loss) after taxation",
  "profit/ (loss) after taxation",
  "profit / (loss) after taxation",
  "loss for the year",
];
const ASSETS = ["total assets"];
const LIABILITIES = ["total liabilities"];
const EQUITY = [
  "total shareholder's equity",
  "total shareholders' equity",
  "total shareholders equity",
  "total shareholders' funds",
  "total equity",
];
const CASH = ["cash and cash equivalents"];
const OCF = [
  "net cash flows generated from/(used in) operating activities",
  "net cash flows generated from operating activities",
  "net cash flows used in operating activities",
  "net cash (used in)/generated from operating activities",
  "net cash generated from operating activities",
  "net cash (used in) operating activities",
  "net cash flows from operating activities",
  "net cash provided by operating activities",
  "net cash generated from operations",
];
const CAPEX = [
  "purchase of property and equipment",
  "purchases of property and equipment",
  "purchase of property, plant and equipment",
  "purchases of property, plant and equipment",
  "acquisition of property, plant and equipment",
  "additions to property, plant and equipment",
];
const DEBT = ["total borrowings", "loans and borrowings", "borrowings", "debt securities"];
const OWNERS = [
  "profit/(loss) attributable to owners of the parent",
  "profit attributable to owners of the parent",
  "profit for the year attributable to owners of the parent",
  "profit/(loss) attributable to owners of the company",
  "profit attributable to owners of the company",
  "profit attributable to equity holders of the parent",
  "owners of the parent",
  "owners of the company",
];
const SHARES = [
  "weighted average number of ordinary shares",
  "weighted average number of shares",
  "weighted average ordinary shares",
  "weighted average shares",
];

/** "4,100,394 ('000)" means four billion shares, not four million. */
function shareScale(raw: string): number {
  if (/(?:['’]\s*000|['’]\s*thousand|in thousands|thousands of shares)/i.test(raw)) return 1e3;
  if (/(?:['’]\s*m|['’]\s*million|in millions|millions of shares)/i.test(raw)) return 1e6;
  return 1;
}

function equityFromSoce(text: string, unit: Unit): number | null {
  const lower = text.toLowerCase();
  const start = lower.indexOf("consolidated statement of changes in equity");
  if (start < 0) return null;
  const separate = lower.indexOf("separate statement of changes in equity", start + 10);
  const end = separate > start ? separate : Math.min(text.length, start + 80_000);
  const window = text.slice(start, end);
  const re = /balance\s+as\s+at\s+31\s+december\s+(\d{4})([^\n]*)/gi;
  let best: { year: number; tail: string } | null = null;
  for (const m of window.matchAll(re)) {
    const year = Number(m[1]);
    const tail = m[2] ?? "";
    if (!best || year >= best.year) best = { year, tail };
  }
  if (!best) return null;
  const nums = numbersIn(best.tail);
  if (nums.length === 0) return null;
  const v = nums[nums.length - 1]!;
  if (!v || v <= 0) return null;
  return Math.round(v * unit.multiplier * 100);
}

function sanitize(a: Amounts, soceEquity: number | null): Amounts {
  const out = { ...a };
  if (out.revenueKobo != null && out.revenueKobo <= 0) out.revenueKobo = null;
  // Profit above revenue is possible for an investment holding company but far
  // more often means the revenue row was taken from the wrong table.
  if (out.revenueKobo != null && out.earningsKobo != null && out.revenueKobo < out.earningsKobo) {
    out.revenueKobo = null;
  }
  if (out.totalAssetsKobo != null && out.totalAssetsKobo <= 0) out.totalAssetsKobo = null;
  if (out.totalEquityKobo != null && out.totalEquityKobo <= 0) out.totalEquityKobo = null;
  if (out.totalDebtKobo != null && out.totalDebtKobo <= 0) out.totalDebtKobo = null;
  if (soceEquity != null && out.totalEquityKobo == null) out.totalEquityKobo = soceEquity;
  // A balance-sheet row that contradicts the equity statement is a mis-parse.
  // Keep the assets figure and drop the suspect equity rather than discarding
  // both.
  if (out.totalAssetsKobo != null && out.totalEquityKobo != null && out.totalEquityKobo > out.totalAssetsKobo) {
    out.totalEquityKobo = null;
  }
  if (out.totalDebtKobo != null && out.totalAssetsKobo != null && out.totalDebtKobo > out.totalAssetsKobo) {
    out.totalDebtKobo = null;
  }
  // A revenue below ₦50m or a profit below ₦1m is not credible for a listed
  // company; it is a mis-read row, not a small business.
  if (out.revenueKobo != null && out.revenueKobo < 5_000_000_000) out.revenueKobo = null;
  if (out.earningsKobo != null && Math.abs(out.earningsKobo) < 100_000_000) out.earningsKobo = null;
  // A listed company's balance sheet is never a few million naira either. A
  // smaller figure is a note or a table fragment, not the statement total.
  if (out.totalAssetsKobo != null && out.totalAssetsKobo < 100_000_000_000) out.totalAssetsKobo = null;
  if (out.totalEquityKobo != null && out.totalEquityKobo < 10_000_000_000) out.totalEquityKobo = null;
  // With no revenue line and no usable balance sheet, the remaining profit
  // figure cannot be cross-checked at all. Report it as unavailable instead of
  // publishing a number that may belong to a different table.
  if (out.revenueKobo == null && (out.totalAssetsKobo == null || out.totalEquityKobo == null)) {
    out.earningsKobo = null;
    out.cashKobo = null;
    out.totalDebtKobo = null;
  }
  // A revenue or profit that is vanishingly small against the balance sheet is
  // almost always a row taken from the wrong table, not a real figure.
  if (out.totalAssetsKobo != null && out.totalAssetsKobo > 0) {
    if (out.revenueKobo != null && out.revenueKobo < out.totalAssetsKobo / 1000) out.revenueKobo = null;
    if (out.earningsKobo != null && Math.abs(out.earningsKobo) < out.totalAssetsKobo / 10_000) out.earningsKobo = null;
  }
  return out;
}

export function parseStatement(rawText: string): ParsedStatement {
  const text = normalize(rawText);
  const lower = text.toLowerCase();

  const income = section(
    text,
    [
      "consolidated and separate statements of profit or loss",
      "consolidated statements of profit or loss",
      "consolidated and separate income statement",
      "consolidated income statement",
      "statements of profit or loss",
      "statement of profit or loss",
      "income statement",
      "statement of comprehensive income",
    ],
    30_000,
    hasIncomeRows,
  );
  const position =
    (() => {
      const tle = lower.indexOf("total liabilities and equity");
      if (tle >= 0) return [Math.max(0, tle - 16_000), Math.min(lower.length, tle + 3_000)] as [number, number];
      return section(text, [
        "consolidated and separate statement of financial position",
        "statement of financial position",
        "balance sheet",
      ]);
    })();
  const cashflow = section(text, ["statement of cash flows", "cash flow statement"]);
  const unit = detectUnit(text, position?.[0] ?? income?.[0] ?? 0);
  const warnings: string[] = [];
  if (!unit.confident) warnings.push("unit not detected");

  const rev = row(text, lower, REVENUE, income, 0, /^\s*tax/i);
  let pbt = row(text, lower, PBT, income);
  const pat = row(text, lower, PAT, income, 0, undefined, true);
  const assets = row(text, lower, ASSETS, position);
  const liabilities = row(text, lower, LIABILITIES, position);
  const equity = row(text, lower, EQUITY, position, 0, /^\s*(?:and|&)\s+liabilities/i);
  const cash = row(text, lower, CASH, position);
  const ocf = row(text, lower, OCF, cashflow, 3);
  const capex = row(text, lower, CAPEX, cashflow, 3);
  const debt = row(text, lower, DEBT, position);
  const owners = row(text, lower, OWNERS, income);
  const sharesRow = row(text, lower, SHARES);

  // Some filers label the pre-tax line only in the five-year summary.
  if (!pbt) pbt = row(text, lower, PBT);

  // Some filers print only an unlabelled equity subtotal, or a "Total equity"
  // column header in the statement of changes in equity. When assets and total
  // liabilities are both present, the accounting identity is a safer source.
  const equityAt = (index: number): number | null => {
    const labeled = kobo(equity?.values, unit, index);
    const a = kobo(assets?.values, unit, index);
    const l = kobo(liabilities?.values, unit, index);
    if (a != null && l != null && l > 0) {
      const derived = a - l;
      if (labeled == null || Math.abs(labeled) < Math.abs(a) * 0.01) return derived;
    }
    return labeled;
  };

  const currentRaw: Amounts = {
    revenueKobo: kobo(rev?.values, unit, 0),
    earningsKobo: kobo(pat?.values, unit, 0),
    totalAssetsKobo: kobo(assets?.values, unit, 0),
    totalEquityKobo: equityAt(0),
    cashKobo: kobo(cash?.values, unit, 0),
    operatingCashFlowKobo: kobo(ocf?.values, unit, 0),
    capexKobo: kobo(capex?.values, unit, 0),
    totalDebtKobo: debt?.values[0] != null ? Math.abs(Math.round(debt.values[0] * unit.multiplier * 100)) : null,
  };
  const current = sanitize(currentRaw, equityFromSoce(text, unit));
  const prior = sanitize(
    {
      revenueKobo: kobo(rev?.values, unit, 1),
      earningsKobo: kobo(pat?.values, unit, 1),
      totalAssetsKobo: kobo(assets?.values, unit, 1),
      totalEquityKobo: equityAt(1),
      cashKobo: kobo(cash?.values, unit, 1),
      operatingCashFlowKobo: kobo(ocf?.values, unit, 1),
      capexKobo: kobo(capex?.values, unit, 1),
      totalDebtKobo: debt?.values[1] != null ? Math.abs(Math.round(debt.values[1] * unit.multiplier * 100)) : null,
    },
    null,
  );

  if (current.revenueKobo == null) warnings.push("revenue not found");
  if (current.earningsKobo == null) warnings.push("earnings not found");

  const epsCandidates = parseEpsCandidates(text);
  const dpsKobo = parseDps(text);
  const ownersEarningsKobo =
    owners?.values[0] != null ? Math.round(owners.values[0] * unit.multiplier * 100) : null;
  const rawShares = sharesRow?.values.find((v) => v > 0);
  const scaledShares =
    rawShares != null && rawShares > 0
      ? Math.round(rawShares * shareScale(sharesRow?.raw ?? ""))
      : null;
  const weightedShares =
    scaledShares != null && scaledShares >= 100_000 && scaledShares <= 1e12 ? scaledShares : null;

  return {
    unit,
    current,
    prior,
    epsRaw: epsCandidates[0]?.value ?? null,
    epsUnitHint: epsCandidates[0]?.unit ?? null,
    epsCandidates,
    ownersEarningsKobo,
    weightedShares,
    dpsKobo,
    warnings,
  };
}

const EPS_LABELS = [
  "basic and diluted earnings/(loss) per share",
  "basic and diluted earning/(loss) per share",
  "basic and diluted earnings /(loss) per share",
  "basic and diluted earning /(loss) per share",
  "basic and diluted earnings/ (loss) per share",
  "basic and diluted earning/ (loss) per share",
  "basic and diluted earnings / (loss) per share",
  "basic and diluted earning / (loss) per share",
  "basic and diluted earnings per share",
  "basic and diluted loss per share",
  "basic & diluted earnings per share",
  "basic & diluted earnings/(loss) per share",
  "basic earnings /(loss) per share",
  "basic earnings/ (loss) per share",
  "basic earnings / (loss) per share",
  "earnings /(loss) per share",
  "earnings/ (loss) per share",
  "earnings / (loss) per share",
  "earnings/(loss) per share - basic/diluted",
  "earnings/(loss) per share",
  "earnings per share (kobo) - basic",
  "earnings per share - basic",
  "basic earnings per share",
  "basic eps",
  "earnings per share (eps)",
  "earnings per share",
];

/**
 * Reports often print an EPS row in the main statement, again in a note, and
 * again in a five-year summary, and some are company-only figures. Return every
 * reading in document order; the caller keeps the first one whose value is
 * credible for the current share price.
 */
export function parseEpsCandidates(text: string): EpsCandidate[] {
  const lower = text.toLowerCase();
  const found: EpsCandidate[] = [];

  for (const label of EPS_LABELS) {
    let i = lower.indexOf(label);
    while (i >= 0) {
      const lineStart = text.lastIndexOf("\n", i) + 1;
      let lineEnd = text.indexOf("\n", i + label.length);
      if (lineEnd === -1) lineEnd = Math.min(text.length, i + label.length + 240);
      let rest = text.slice(i + label.length, lineEnd);
      // Wrapped rows put the values on the following line:
      // "Basic earnings per share (expressed in naira per" / "share) 25.43 ..."
      if (!/\d/.test(rest)) {
        const nextEnd = text.indexOf("\n", lineEnd + 1);
        const next = text.slice(
          lineEnd + 1,
          nextEnd === -1 ? Math.min(text.length, lineEnd + 240) : nextEnd,
        );
        if (/\d/.test(next)) rest = `${rest} ${next}`;
      }
      // "Per share data (kobo)" is often the line above the row, so look back
      // a little as well as at the row itself.
      const context = text.slice(Math.max(0, lineStart - 240), i);
      const tokens: Array<{ raw: string; start: number; value: number }> = [];
      for (const m of rest.matchAll(MONEY)) {
        const raw = m[0];
        const start = m.index ?? 0;
        const after = rest.slice(start + raw.length, start + raw.length + 2);
        // "(99) %" is a change column, not a per-share value.
        if (after.trimStart().startsWith("%")) continue;
        // "Earnings per share (kobo) 18. 214" — the 18 is a note reference.
        if (after.startsWith(".") && !/^\.\d/.test(after)) continue;
        const value = toNumber(raw);
        if (value == null || Math.abs(value) > 1_000_000) continue;
        // A bare four-digit year in a narrative is not an EPS value.
        if (!/[.,]/.test(raw) && Math.abs(value) >= 1900 && Math.abs(value) <= 2100) continue;
        tokens.push({ raw: raw.trim(), start, value });
      }
      if (tokens.length > 0) {
        // A five-column row often starts with the note number
        // ("Basic earnings per share (kobo) 16 6 725 410 346"). The first
        // value after it is the current-year group figure; the rest are the
        // prior year and the company-only columns.
        const oneDecimal = /^\d{1,2}\.\d$/.test(tokens[0]!.raw);
        const skipNote =
          Math.abs(tokens[0]!.value) <= 99 && (tokens.length >= 5 || oneDecimal);
        const chosen = tokens.slice(skipNote ? 1 : 0).find((t) => t.value > 0);
        if (chosen) {
          const hint = `${rest} ${context}`;
          const unit = /kobo|\(k\)/i.test(hint)
            ? "kobo"
            : /naira|\(n\)|₦|ngn/i.test(hint)
              ? "naira"
              : null;
          // A lone bare integer with no unit is a contents-page or note
          // reference. A row with several values is a real table.
          if (!(unit == null && tokens.length === 1 && !/[.,]/.test(chosen.raw))) {
            found.push({ value: chosen.value, unit, at: i });
          }
        }
      }
      i = lower.indexOf(label, i + label.length);
    }
  }

  return found.sort((a, b) => a.at - b.at);
}

export function parseEps(text: string): { value: number | null; unit: "kobo" | "naira" | null } {
  const first = parseEpsCandidates(text)[0];
  return { value: first?.value ?? null, unit: first?.unit ?? null };
}

export function parseDps(text: string): number | null {
  // Normalise "N1:00" (colon used as a decimal separator in some reports).
  const t = text.replace(/([N₦]\s*\d+):(\d{2})\b/g, "$1.$2");

  const amount = (raw: string, unit?: string): number | null => {
    const v = Number(raw.replace(/,/g, ""));
    if (!Number.isFinite(v) || v < 0) return null;
    const u = (unit ?? "").toLowerCase();
    const kobo = u === "kobo" ? Math.round(v) : Math.round(v * 100);
    // No NGX share pays more than a few hundred naira per share; a larger
    // number is a total dividend or a mis-read row, not a per-share amount.
    if (kobo > 1_000_000) return null;
    return kobo;
  };
  const take = (m: RegExpMatchArray | null): number | null => (m ? amount(m[1]!, m[2]) : null);

  // 1. The report states the total dividend for the year. Most reliable.
  const total = t.match(/total\s+dividend[\s\S]{0,260}?(?:₦|NGN|\bN)\s*([\d,]+(?:\.\d+)?)\s*(kobo|k)?\b/i);
  if (total) {
    const v = take(total);
    if (v != null) return v;
  }

  // 2. "Dividend for 2025: ₦337.23 per share" (common for dual-currency
  //    reporters such as Seplat).
  const yearTotal = t.match(
    /dividend\s+for\s+(?:the\s+)?(?:year\s+)?(?:ended\s+)?\d{4}\s*:\s*(?:₦|NGN|\bN)\s*([\d,]+(?:\.\d+)?)\s*(kobo|k)?\b/i,
  );
  if (yearTotal) {
    const v = take(yearTotal);
    if (v != null) return v;
  }

  // 3. The dividend directors recommend/propose for the current year.
  //    "per ordinary 50 kobo share" may sit between the amount and "share".
  const recommended = t.match(
    /(?:recommend(?:ed|s)?|propos(?:e|ed|al\s+of))\s+(?:the\s+payment\s+of\s+)?(?:a\s+)?(?:final\s+|interim\s+)?dividend[^.\n]{0,120}?(?:₦|NGN|\bN)\s*([\d,]+(?:\.\d+)?)\s*(kobo|k)?\b/i,
  );
  if (recommended) {
    const v = take(recommended);
    if (v != null) return v;
  }

  // 4. An explicit "nil" for the year's dividend is a real zero, not missing.
  if (/(?:final|interim|total)\s+dividend[\s\S]{0,140}?\bnil\b/i.test(t)) return 0;

  // 5. Otherwise sum the final and interim dividends if both are stated.
  const fin = take(t.match(/(?:final)\s+dividend[^\n.]{0,90}?(?:₦|NGN|\bN)\s*([\d,]+(?:\.\d+)?)\s*(kobo|k)?\b/i));
  const interim = take(t.match(/(?:interim)\s+dividend[^\n.]{0,90}?(?:₦|NGN|\bN)\s*([\d,]+(?:\.\d+)?)\s*(kobo|k)?\b/i));
  if (fin || interim) return (fin ?? 0) + (interim ?? 0);

  // 6. Last resort: any dividend phrased "per ... share".
  const single = t.match(
    /(?:dividend[^\n.]{0,140}?)(?:₦|NGN|\bN)\s*([\d,]+(?:\.\d+)?)\s*(kobo|k)?\b[^\n.]{0,40}?(?:per|each)\s+[^\n.]{0,25}?share/i,
  );
  return take(single);
}

export function ratio(numerator: number | null, denominator: number | null): number | null {
  if (numerator == null || denominator == null || denominator === 0) return null;
  return numerator / denominator;
}

export function growth(current: number | null, prior: number | null): number | null {
  if (current == null || prior == null || prior === 0) return null;
  return (current - prior) / Math.abs(prior);
}
