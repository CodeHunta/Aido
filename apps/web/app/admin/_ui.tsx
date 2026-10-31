import React from "react";

export const DAY = 86_400_000;

export function ago(d: Date | string | null | undefined): string {
  if (!d) return "never";
  const ms = Date.now() - new Date(d).getTime();
  if (ms < 0) return "just now";
  if (ms < 60_000) return "just now";
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < DAY) return `${Math.floor(ms / 3_600_000)}h ago`;
  if (ms < 30 * DAY) return `${Math.floor(ms / DAY)}d ago`;
  return new Date(d).toISOString().slice(0, 10);
}

export function naira(kobo: number | null | undefined): string {
  if (kobo == null) return "No data";
  // Keep kobo precision: ₦1,408.89 must not be shown as ₦1,409.
  return "₦" + (kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function compactNaira(kobo: number | null | undefined): string {
  if (kobo == null) return "No data";
  const n = kobo / 100;
  if (Math.abs(n) >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}b`;
  if (Math.abs(n) >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}m`;
  if (Math.abs(n) >= 1_000) return `₦${(n / 1_000).toFixed(1)}k`;
  return `₦${n.toFixed(0)}`;
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return "Not set";
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function kpi(label: string, value: string | number, note?: string) {
  return (
    <div key={label} style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 0.6, color: "var(--muted)", textTransform: "uppercase" }}>{label}</div>
      <div className="num" style={{ fontSize: 30, fontWeight: 800, marginTop: 6 }}>{value}</div>
      {note ? <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{note}</div> : null}
    </div>
  );
}

export function panel(title: string, subtitle: string | undefined, children: React.ReactNode, extra?: React.ReactNode) {
  return (
    <section style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{title}</h2>
          {subtitle ? <p style={{ fontSize: 13, color: "var(--muted)", margin: "4px 0 0" }}>{subtitle}</p> : null}
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}

export interface Slice {
  label: string;
  value: number;
}

const PALETTE = ["#0047AB", "#2563eb", "#0ea5e9", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6", "#64748b"];

// Pure SVG donut. No client JS, so it renders with the page and works even if
// the browser has scripting disabled.
export function Donut({ data, size = 168, caption }: { data: Slice[]; size?: number; caption?: string }) {
  const cleaned = data.filter((d) => d.value > 0);
  const total = cleaned.reduce((a, d) => a + d.value, 0);
  if (!total) {
    return <p style={{ fontSize: 14, color: "var(--muted)", margin: "16px 0 0" }}>No data recorded yet.</p>;
  }
  let cursor = 0;
  const segments = cleaned.map((d, i) => {
    const pct = (d.value / total) * 100;
    const offset = cursor;
    cursor += pct;
    return { ...d, pct, offset, color: PALETTE[i % PALETTE.length]! };
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap", marginTop: 14 }}>
      <div style={{ position: "relative", width: size, height: size, flex: "0 0 auto" }}>
        <svg viewBox="0 0 42 42" width={size} height={size} role="img" aria-label={caption ?? "Distribution"}>
          <circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--border)" strokeWidth="6" />
          {segments.map((s) => (
            <circle
              key={s.label}
              cx="21"
              cy="21"
              r="15.9155"
              fill="none"
              stroke={s.color}
              strokeWidth="6"
              strokeDasharray={`${s.pct} ${100 - s.pct}`}
              strokeDashoffset={25 - s.offset}
            >
              <title>{`${s.label}: ${s.value} (${s.pct.toFixed(1)}%)`}</title>
            </circle>
          ))}
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div className="num" style={{ fontSize: 24, fontWeight: 800 }}>{total}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", letterSpacing: 0.6 }}>{caption ?? "total"}</div>
        </div>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 7, minWidth: 180, flex: 1 }}>
        {segments.map((s) => (
          <li key={s.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flex: "0 0 auto" }} />
            <span style={{ fontWeight: 700 }}>{s.label}</span>
            <span className="num" style={{ marginLeft: "auto", color: "var(--muted)" }}>{s.value} · {s.pct.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Bars({ data, color = "var(--cobalt)", height = 120 }: { data: { label: string; value: number }[]; color?: string; height?: number }) {
  if (!data.length) return <p style={{ fontSize: 14, color: "var(--muted)", margin: "16px 0 0" }}>No data recorded yet.</p>;
  const peak = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height, marginTop: 16 }}>
      {data.map((d, i) => (
        <div key={`${d.label}-${i}`} style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "center", gap: 5, minWidth: 0 }}>
          <div className="num" style={{ fontSize: 10, color: "var(--muted)" }}>{d.value || ""}</div>
          <div
            title={`${d.label}: ${d.value}`}
            style={{ width: "100%", height: `${Math.max(3, (d.value / peak) * (height - 34))}px`, background: d.value ? color : "var(--border)", borderRadius: 5 }}
          />
          <div style={{ fontSize: 9, color: "var(--muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data, height = 150, format }: { data: { label: string; value: number }[]; height?: number; format?: (n: number) => string }) {
  if (data.length === 0) return <p style={{ fontSize: 14, color: "var(--muted)", margin: "16px 0 0" }}>No history yet. A daily snapshot starts recording from the next refresh.</p>;
  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = data.map((d, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
    const y = 40 - ((d.value - min) / span) * 36;
    return `${x},${y}`;
  });
  const last = data[data.length - 1]!;
  const first = data[0]!;
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)" }}>
        <span>{first.label}</span>
        <span className="num" style={{ color: "var(--text)", fontWeight: 800 }}>{format ? format(last.value) : last.value}</span>
        <span>{last.label}</span>
      </div>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" width="100%" height={height} role="img" aria-label="Trend">
        <polyline points={`0,40 ${points.join(" ")} 100,40`} fill="rgba(0,71,171,0.10)" stroke="none" />
        <polyline points={points.join(" ")} fill="none" stroke="var(--cobalt)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function rangeTabs(active: string, href: (key: string) => string) {
  const options = [
    ["14", "14 days"],
    ["30", "30 days"],
    ["90", "90 days"],
    ["365", "1 year"],
    ["all", "All time"],
  ] as const;
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {options.map(([key, label]) => (
        <a
          key={key}
          href={href(key)}
          style={{
            fontSize: 12,
            fontWeight: 800,
            padding: "6px 10px",
            borderRadius: 999,
            border: "1px solid var(--border)",
            background: active === key ? "var(--cobalt)" : "transparent",
            color: active === key ? "#fff" : "var(--text)",
            textDecoration: "none",
          }}
        >
          {label}
        </a>
      ))}
    </div>
  );
}

// Group counts into a fixed bucket grid so gaps show as zero instead of
// silently compressing the timeline.
export function bucketDates(dates: Date[], start: Date, end: Date, mode: "day" | "week" | "month") {
  const buckets: { key: string; label: string; start: Date; end: Date; value: number }[] = [];
  if (mode === "month") {
    const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
    while (cursor <= end) {
      const next = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
      buckets.push({ key: cursor.toISOString().slice(0, 7), label: cursor.toISOString().slice(0, 7), start: cursor, end: next, value: 0 });
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  } else {
    const step = mode === "week" ? 7 * DAY : DAY;
    let cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
    while (cursor <= end) {
      const next = new Date(cursor.getTime() + step);
      buckets.push({ key: cursor.toISOString().slice(0, 10), label: cursor.toISOString().slice(5, 10), start: cursor, end: next, value: 0 });
      cursor = next;
    }
  }
  for (const d of dates) {
    const t = new Date(d).getTime();
    const bucket = buckets.find((b) => t >= b.start.getTime() && t < b.end.getTime());
    if (bucket) bucket.value += 1;
  }
  return buckets;
}
