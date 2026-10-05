// Sunday engine (runnable any day): market pick + personal picks, in-app alerts,
// email (ZeptoMail when keys exist, logged otherwise), Expo push (best effort).
// Run: pnpm --filter @aido/worker weekly
import { desc, eq, like } from "@aido/db/drizzle";
import {
  alerts,
  db,
  devices,
  investorProfiles,
  recommendations,
  users,
  weeklyPicks,
} from "@aido/db";
import { getTraits } from "@aido/db/traits";
import { suitFor } from "@aido/scoring";
import { recChangeHtml, sendEmail, weeklyPickHtml } from "@aido/email";

function lastSunday(d = new Date()): string {
  const t = new Date(d);
  t.setDate(t.getDate() - t.getDay());
  return t.toISOString().slice(0, 10);
}

async function pushToDevices(userId: string, title: string, body: string): Promise<number> {
  const devs = await db.select().from(devices).where(eq(devices.userId, userId));
  if (devs.length === 0) return 0;
  let ok = 0;
  try {
    const res = await fetch("https://expopush.expo.dev/v2/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(devs.map((x) => ({ to: x.token, title, body }))),
    });
    if (res.ok) ok = devs.length;
  } catch (e) {
    console.error(`[push] failed for ${userId}:`, (e as Error).message);
  }
  return ok;
}

async function main() {
  const week = process.argv[2] ?? lastSunday();
  console.log(`[weekly] week=${week}`);

  const recs = await db.select().from(recommendations).orderBy(desc(recommendations.score));
  const market = recs[0] && recs[0].score >= 65 ? recs[0] : null;
  await db.delete(weeklyPicks);
  await db.delete(alerts).where(like(alerts.id, `${week}%`)); // idempotent reruns
  if (market) {
    await db.insert(weeklyPicks).values({ id: `${week}-market`, week, kind: "market", ticker: market.ticker, action: market.action, score: market.score, rationale: (market.why as string[]).join("; ") });
    console.log(`[weekly] market pick: ${market.ticker} ${market.action} ${market.score}`);
  } else {
    console.log("[weekly] No strong opportunity this week — saying so honestly.");
  }

  const profiles = await db.select().from(investorProfiles);
  for (const p of profiles) {
    let personal: (typeof recs)[number] | null = null;
    for (const r of recs) {
      if (r.score < 65) break;
      const t = await getTraits(r.ticker);
      if (!t) continue;
      const s = suitFor(
        { risk: p.risk, horizon: p.horizon, objective: p.objective },
        { volatility: t.volatility, avgDailyValueKobo: t.avgDailyValueKobo, categories: t.categories, dividendYield: t.dividendYield },
      );
      if (s.level !== "low") {
        personal = r;
        break;
      }
    }
    await db.insert(weeklyPicks).values({
      id: `${week}-personal-${p.userId}`,
      week,
      kind: "personal",
      userId: p.userId,
      ticker: personal?.ticker ?? null,
      action: personal?.action ?? null,
      score: personal?.score ?? null,
      rationale: personal ? ((personal.why as string[]).join("; ") || "") : "No strong opportunity this week.",
    });
    const title = personal ? `Your Aido Pick: ${personal.ticker} ${personal.action} ${personal.score}/100` : "No strong opportunity this week";
    await db.insert(alerts).values({
      id: `${week}-pick-${p.userId}`,
      userId: p.userId,
      type: "weekly_pick",
      ticker: personal?.ticker ?? null,
      title,
      body: personal ? `Strong growth + reasonable valuation. View recommendation →` : "Aido would rather say nothing than push a weak BUY.",
    });
    const u = (await db.select().from(users).where(eq(users.id, p.userId)))[0];
    if (u?.email) {
      await sendEmail({
        to: u.email,
        subject: personal ? `Your Aido Pick: ${personal.ticker} ${personal.action}` : "No strong opportunity this week",
        html: weeklyPickHtml(p.userId, personal ? { ticker: personal.ticker, score: personal.score, action: personal.action ?? "" } : null, market ? { ticker: market.ticker, score: market.score } : null),
      });
    } else {
      console.log(`[weekly] ${p.userId}: no email on file — in-app alert only`);
    }
    const pushed = await pushToDevices(p.userId, "Your Aido Pick is in 🎯", title);
    console.log(`[weekly] ${p.userId}: personal=${personal?.ticker ?? "none"} pushed=${pushed}`);
  }

  // Rec-change detector: compare each ticker's two latest recommendations
  let changes = 0;
  const tickers = [...new Set(recs.map((r) => r.ticker))];
  for (const ticker of tickers) {
    const hist = await db.select().from(recommendations).where(eq(recommendations.ticker, ticker)).orderBy(desc(recommendations.asOf)).limit(2);
    if (hist.length === 2 && hist[0]!.action !== hist[1]!.action) {
      changes++;
      const reason = `Score moved and evidence changed the call.`;
      console.log(`[change] ${ticker}: ${hist[1]!.action} → ${hist[0]!.action}`);
      for (const p of profiles) {
        await db.insert(alerts).values({
          id: `${week}-chg-${ticker}-${p.userId}`,
          userId: p.userId,
          type: "rec_change",
          ticker,
          title: `Aido changed ${ticker} from ${hist[1]!.action} to ${hist[0]!.action}`,
          body: reason,
        });
        const u = (await db.select().from(users).where(eq(users.id, p.userId)))[0];
        if (u?.email) await sendEmail({ to: u.email, subject: `Aido changed ${ticker}`, html: recChangeHtml(ticker, hist[1]!.action ?? "?", hist[0]!.action ?? "?", reason) });
      }
    }
  }
  console.log(`[weekly] done. rec-changes=${changes}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
