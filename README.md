# Aido

> **Don't just know what the market is doing. Know what it means for you.**

Aido is a mobile-first investment intelligence platform for Nigerian equities (NGX). It turns complex market data into **clear, personalized, explainable** intelligence — not black-box tips.

Every recommendation answers four questions:
1. **Is it good?** — fundamental quality
2. **Is it worth the current price?** — valuation + risk/reward
3. **Is it right for this investor?** — personal suitability
4. **Does it fit this portfolio?** — portfolio impact

Then it explains itself: **Why? / Why now? / Why for me? / What could go wrong?**

- Product spec: [`docs/Aido - Product Requirements Document.md`](docs/Aido%20-%20Product%20Requirements%20Document.md)
- Build plan: [`docs/Aido - Implementation Plan.md`](docs/Aido%20-%20Implementation%20Plan.md)
- Design preview: open [`docs/design-system-preview.html`](docs/design-system-preview.html) in a browser (no build needed)

---

## Features (MVP — PRD §36)

- **Investor Profile:** risk, horizon, objective, capital, frequency, holdings
- **NGX Universe:** search, 7 categories (large-cap, growth, dividend, value, high-growth/high-risk, turnaround, speculative), stock profiles
- **Stock Intelligence (7 dims):** fundamentals, valuation, growth, market behaviour, dividends, risk, news/events
- **Aido Score 0–100 + Confidence** + versioned scoring engine
- **Actions:** BUY / HOLD / SELL / WATCH / NO_STRONG_OPPORTUNITY (no forced BUYs)
- **Suitability:** Suitable vs Outside Your Profile + portfolio impact (`Financials 18% → 24%`)
- **Portfolio:** value, P&L, allocation, concentration, dividend yield
- **Watchlist + material-change alerts**
- **Weekly Picks:** market-wide + personalized (Sunday) via in-app + email
- **Explainability:** 3-bullet Why + key risk + full thesis behind `View Analysis`

Post-MVP (deferred): conversational Aido, advanced compare, financial calendar, dividend center v2, rec history/backtests, deep market intel.

---

## Stack (locked — no Supabase / no Vercel)

| Layer | Choice |
|---|---|
| Web | Next.js 14+ (App Router), TypeScript strict, Tailwind CSS, shadcn/ui + Radix |
| Mobile | React Native + Expo (Expo Router, NativeWind, React Query) |
| API | Next.js Route Handlers (`/api/v1/*`, Zod, OpenAPI) |
| DB | Local Postgres 16 (Docker) + Drizzle ORM + Redis (cache/queue) |
| Auth | Better Auth (Drizzle adapter, web cookie + Expo Secure Store Bearer) |
| Files | Cloudflare R2 (S3-compatible, presigned URLs) |
| Email | ZeptoMail (weekly picks, rec-change, alerts) |
| Hosting | Local device — Docker Compose + Caddy + Cloudflare Tunnel/Tailscale |
| Payments | Paystack (Freemium → Premium) |
| Notify | Phase 1: in-app + email (+ best-effort Expo Push). Phase 1.5: Termii / Twilio / WhatsApp Cloud |

Planned monorepo (`turborepo + pnpm`):

```
apps/web/            # Next.js web + /api/v1
apps/mobile/         # Expo app
services/worker/     # BullMQ jobs: ingest, scoring, picks, alerts
packages/db/         # Drizzle schema + migrations
packages/scoring/    # pure-TS score_v1 engine (tested)
packages/auth/       # Better Auth config
packages/email/      # ZeptoMail templates
packages/payments/   # Paystack client + webhooks
packages/design-tokens/
infra/               # docker-compose.yml, Caddyfile, backup scripts
```

> Repo is currently docs-only. Scaffolding lands next (`apps/*`, `packages/*`, `infra/*`).

---

## Getting started (local-first)

### Prerequisites
- Node 20+, pnpm 9+, Docker Desktop, Git, Expo Go (for device testing)
- Accounts/keys: Cloudflare R2, ZeptoMail Mail Agent, Paystack test keys, (optional) Cloudflare Tunnel

### 1. Clone + install (once scaffolded)
```bash
git clone https://github.com/CodeHunta/Aido.git
cd Aido
pnpm install
cp .env.example .env   # fill DATABASE_URL, BETTER_AUTH_SECRET, R2_*, ZEPTOMAIL_*, PAYSTACK_*
```

### 2. Start local infra (Postgres + Redis + Caddy)
```bash
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @aido/db migrate
pnpm --filter @aido/db seed   # 40-ticker NGX seed + CSV fallback
```

`DATABASE_URL=postgres://aido:aido@localhost:5432/aido` (host) or `postgres://aido:aido@postgres:5432/aido` (inside Docker).

### 3. Run web + worker + mobile
```bash
pnpm dev              # web :3000 + worker
pnpm --filter @aido/mobile start   # Expo — scan QR with Expo Go
EXPO_PUBLIC_API_URL=http://<your-lan-ip>:3000/api/v1 pnpm --filter @aido/mobile start
```

Physical phones can't reach `localhost` — use LAN IP or `cloudflared tunnel --url http://localhost:3000`.

### Key env vars
```
DATABASE_URL= REDIS_URL= BETTER_AUTH_SECRET= BETTER_AUTH_URL=
R2_ACCOUNT_ID= R2_ACCESS_KEY_ID= R2_SECRET_ACCESS_KEY= R2_BUCKET_UPLOADS= R2_BUCKET_BACKUPS=
ZEPTOMAIL_API_KEY= ZEPTOMAIL_FROM=noreply@yourdomain.com
PAYSTACK_PUBLIC_KEY= PAYSTACK_SECRET_KEY= PAYSTACK_WEBHOOK_SECRET=
EXPO_PUBLIC_API_URL= NEXT_PUBLIC_API_URL=
```

---

## Design system

Preview: `docs/design-system-preview.html` — toggle light/dark.

- Tokens in `packages/design-tokens/tokens.json` → Tailwind theme (web) + NativeWind (mobile)
- Web uses shadcn/ui directly; mobile ports the same props (`<ActionBadge action="BUY"/>`)
- Canonical components: `ScoreRing`, `ActionBadge`, `ConfidencePill`, `SuitabilityBadge`, `WhyList`, `RiskCallout`, `MetricTile`, `AllocationBar`, `RecommendationCard`, `ThesisSection`, `EmptyState`
- Rule: concise card by default, full thesis behind `View Analysis`. `X-Data-As-Of` on every view.

---

## Scripts (after scaffold)

```bash
pnpm dev          # all apps in dev
pnpm build        # Turborepo build
pnpm lint         # eslint + tsc --noEmit
pnpm test         # vitest (scoring) + playwright (web e2e)
pnpm db:migrate   # drizzle-kit migrate
pnpm db:backup    # pg_dump -Fc → R2 (nightly in prod-sim)
```

Backups are mandatory on local hosting: nightly dump → `aido-backups` R2 bucket, 7-day local retention, restore tested monthly.

---

## Roadmap

- [x] PRD + implementation plan v2 + DS preview
- [ ] Turborepo scaffold + Docker Compose + Drizzle bootstrap
- [ ] Better Auth + R2 + ZeptoMail wiring
- [ ] NGX adapter spike + 40-ticker seed
- [ ] `score_v1` engine + fixtures (TDD)
- [ ] Web MVP screens + Expo MVP screens
- [ ] Weekly picks + alerts (in-app + email)
- [ ] Paystack Premium gate
- [ ] Beta (30–50 users) → Phase 1.5 SMS/WhatsApp

North Star (PRD §41): **% of active investors who use Aido weekly to make/review decisions.** Also tracked: WAU, portfolio-connected %, pick CTR, watchlist engagement, D7/D30, premium intent.

---

## Disclaimer

Aido provides **educational investment intelligence, not financial advice**. Scores and actions are model outputs with stated confidence, data-as-of dates, risks, and contradictory evidence. Past patterns do not guarantee future results. SEC Nigeria considerations require legal review before public launch.

---

## Contributing

PRs welcome once scaffolding lands. Keep PRs small, add/extend tests for `packages/scoring`, never commit `.env` or secrets, and follow the decision framework: good? → worth the price? → right for investor? → fits portfolio?

## License

TBD — default all rights reserved until a license is chosen. Open an issue to propose MIT/Apache-2.0/Proprietary.
