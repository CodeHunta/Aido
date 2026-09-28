# Aido — Implementation Plan (v2 — Locked Stack)

**Source:** `docs/Aido - Product Requirements Document.md` (PRD v1, 43 sections)
**Goal:** MVP per PRD §36 that proves: *NGX data → explainable, personalized intelligence*
**Decision Framework (PRD §39):** Is it good? → Is it worth the price? → Is it right for this investor? → Does it fit this portfolio?

**Locked stack (user decision, 2026-09-28):**
- Web: Next.js 14+ (App Router), TypeScript strict, Tailwind CSS, shadcn/ui + Radix — no Vercel
- Mobile: React Native + Expo (Expo Router)
- DB: Local Postgres (Docker on your device) — no Supabase
- Auth: Better Auth (Drizzle adapter, shared web + mobile)
- Files: Cloudflare R2 (S3-compatible)
- Emails: ZeptoMail (Zoho)
- Hosting: Local device (Docker Compose + Caddy + tunnel)
- Payments: Paystack (Premium)
- Notifications: Phase 1 = in-app + email only; Phase 1.5 = Termii / Twilio / WhatsApp Cloud for reminders

---

## 0. MVP Scope Lock

Same as PRD §36:
1. Investor Profile (risk, horizon, goal, capital, frequency, portfolio)
2. NGX Universe (search, 7 categories, stock profiles)
3. Stock Intelligence (7 dims: Fundamentals, Valuation, Growth, Dividends, Risk, Market Behaviour, News)
4. Recommendation Engine: BUY / HOLD / SELL / WATCH / NO_STRONG_OPPORTUNITY
5. Aido Score 0-100 + Confidence + explanation
6. Suitability: Suitable / Outside Profile + portfolio relevance
7. Portfolio: holdings, performance, allocation, risk, dividends
8. Watchlist + material-change alerts
9. Weekly Picks: market + personal, Sunday
10. Notifications (Phase 1: in-app + email; push via Expo Push where reachable)

Deferred to post-MVP (PRD §37): Conversational Aido, advanced compare, calendar, dividend center v2, history/backtest, advanced profiling/discovery, deep market intel.

**Exit criteria (PRD §42):** user answers in <2 min: What's interesting? Why? Suitable for me? Fit my portfolio? What could go wrong? What changed?

---

## Phase 1 — Design System (Week 1-2)

### 1.1 IA & flows (mobile-first, 360px; responsive web)
Onboarding (≤5 steps) → Dashboard → Discover → Stock Detail (concise → View Analysis) → Compare (basic 2-way) → Portfolio → Watchlist → Weekly Pick → Alerts → Profile Edit. Progressive disclosure everywhere.

### 1.2 Tokens (single source of truth)
Define in `packages/design-tokens/tokens.json` → generate Tailwind theme (web) + NativeWind theme (mobile):
- Colors: `background/foreground/muted/border` + semantic `buy-green/hold-amber/sell-red/watch-blue/neutral` + `risk-high/med/low`. Light + dark from day 1.
- Type: Inter (or Plus Jakarta Sans) + tabular-nums for ₦. Web: `text-xs→4xl`; Mobile: 14sp min body.
- Spacing 4pt, radius 8/12/16/20, shadows 0/1/2. Lucide icons both platforms.

### 1.3 Components
- **Web (apps/web):** shadcn/ui + Radix primitives: `Button, Card, Badge, Dialog/Sheet, Tabs, Table, Input/Select, Avatar, Skeleton, Sonner Toaster, Recharts`. Custom: `ScoreRing, ConfidencePill, ActionBadge, SuitabilityBadge, WhyList, RiskCallout, ThesisSection, MetricTile, AllocationBar, EmptyState`.
- **Mobile (apps/mobile):** mirror with NativeWind + `react-native-svg` (ScoreRing), `expo-router` tabs, `flash-list`, `react-native-gifted-charts` or `victory-native`, `expo-notifications`, `react-query`. Do NOT install full shadcn mobile lib — port the API (`<ActionBadge action="BUY"/>` same props both platforms).
- Canonical **Recommendation Card** (PRD §10) + Thesis template (§11) + explainability footer (Why? / Why now? / Why for me? / What could go wrong? + data-as-of + methodology link).

**Deliverable:** Figma → coded Storybook (web) + Expo showcase screen. **Accept:** zero one-off styles; dark mode passes AA.

---

## Phase 2 — Architecture (ADRs, local-first)

### 2.1 Monorepo (Turborepo + pnpm)
```
apps/web/            # Next.js 14+ App Router, TS strict, Tailwind, shadcn/ui
apps/mobile/         # Expo SDK 52+, Expo Router, NativeWind, React Query
services/worker/     # Node 20 jobs: ingest, scoring, weekly picks, alerts, email
packages/db/         # Drizzle ORM schema + migrations (local Postgres)
packages/scoring/    # pure-TS Aido Score engine v1 (shared web/worker, unit-tested)
packages/auth/       # Better Auth config (Drizzle adapter)
packages/ui/         # shared web ui wrappers (shadcn)
packages/design-tokens/
packages/email/      # ZeptoMail templates + sender
packages/payments/   # Paystack client + webhooks
infra/               # docker-compose.yml, Caddyfile, backup scripts
```

### 2.2 Local Postgres — answer to "what can we use?"
Use **Postgres 16 in Docker on your device**. No Supabase.
- `infra/docker-compose.yml`: `postgres:16-alpine` (volume `pgdata`), `redis:7` (cache/queue), `web` (Next.js standalone), `worker` (Node), `caddy` (reverse proxy :80/:443).
- ORM: **Drizzle ORM + drizzle-kit** (`packages/db/schema.ts`, `migrations/`). Extensions: `pg_trgm` (search), `unaccent`. Money in **kobo integers**, timestamps `timestamptz`.
- Connection: `DATABASE_URL=postgres://aido:aido@localhost:5432/aido` (dev directly on host; in Docker via service name `postgres`).
- Backups (critical on local): nightly `pg_dump -Fc` → gzip → upload to **R2 bucket `aido-backups`** + 7-day local retention. Test restore monthly.
- Later migration path: same Drizzle code runs on any managed Postgres (Neon/RDS) — no rewrite.

### 2.3 Auth — Better Auth (no Supabase Auth)
- `packages/auth/auth.ts`: Better Auth + Drizzle adapter + email/password + Google + Apple (web OAuth; mobile via `expo-auth-session` → exchange code with web endpoint).
- Session: httpOnly cookie on web; mobile stores session token in `expo-secure-store` + sends `Authorization: Bearer` to `/api/v1/*`. One `user` table, RLS replaced by **server-side ownership checks** (`where(eq(portfolios.userId, session.user.id))` on every query).
- Profile lives in `investor_profiles(userId PK/FK)`.

### 2.4 API — Next.js App Router (no separate Python API for MVP)
- Routes: `apps/web/app/api/v1/.../route.ts` (REST, Zod validation, OpenAPI via `next-openapi` or hand-written `openapi.json`):
`GET /stocks`, `GET /stocks/[ticker]`, `GET /stocks/[ticker]/thesis`, `GET /compare`, `GET/PATCH /profiles/me`, `CRUD /portfolio`, `GET /portfolio/analysis`, `CRUD /watchlist`, `GET /picks/current`, `GET /alerts`, `POST /devices`, `POST /paystack/webhook`.
- Caching: Redis (`prices:latest`, `stock:detail:{ticker}` 5-min TTL) + `fetch(..., {next:{revalidate}})` where safe. `X-Data-As-Of` header everywhere.
- Scoring stays pure in `packages/scoring/score_v1.ts` + `engine_v1.json` weights. Worker writes `factor_scores` + `recommendations`; API only reads + computes suitability on the fly.

### 2.5 Files (R2), Email (ZeptoMail)
- R2: buckets `aido-uploads` (avatars, CSV imports), `aido-backups`, `aido-reports` (thesis PDFs later). S3-compatible client (`@aws-sdk/client-s3` with `endpoint=https://<acct>.r2.cloudflarestorage.com`). Presigned URLs for upload/download; never expose secret keys to mobile.
- ZeptoMail: `packages/email/` with templates `weekly-pick`, `rec-change`, `welcome`, `alert`. Sender via ZeptoMail API (`MAIL_AGENT` token in `.env`). Phase 1 sends all user-facing notifications via in-app + email. No SMS yet.

### 2.6 Local hosting (no Vercel)
- Dev: `pnpm dev` (web :3000, worker, Expo Go). Prod-sim: `docker compose up --build` → Caddy `:80` → web `:3000`.
- Remote access for real-device testing: **Cloudflare Tunnel (`cloudflared`) or Tailscale**. Expo dev + API base URL set via `EXPO_PUBLIC_API_URL=https://<your-tunnel>/api/v1`. Without this, physical phones can't reach `localhost`.
- Uptime caveats (local device sleeps / power / IP changes): document quiet-hours retry for weekly job; run worker with `restart: unless-stopped`; keep laptop plugged, disable sleep. Acceptable for MVP/beta; plan managed host before public launch.
- Observability: health endpoint `/api/health`, Uptime Kuma (optional Docker), Sentry self-host or SaaS, PostHog SaaS or self-host, logs to volume.

### 2.7 ADRs to record in `docs/adr/`
ADR-01 Next.js API vs separate FastAPI (choose Next.js for MVP speed, revisit Python only if quant needs pandas). ADR-02 Drizzle vs Prisma (Drizzle, SQL-first). ADR-03 Better Auth session strategy web+Expo. ADR-04 Opportunity vs Suitability stored separately. ADR-05 Scoring versioned pure function. ADR-06 Kobo minor units. ADR-07 Local-hosting tradeoffs + backup-to-R2 requirement.

---

## Phase 3 — Data & NGX Ingestion (Weeks 3-4, biggest risk)

Schema in `packages/db/schema.ts` (same 12 tables as v1 plan: `investor_profiles, stocks, prices_daily, financials, dividends, corporate_events, news, factor_scores, recommendations, suitability_cache, portfolios, portfolio_snapshots, watchlists, alerts, weekly_picks, devices`).

Ingest (in `services/worker/jobs/`):
- `IngestAdapter` interface (`fetchPrices/fetchFinancials/fetchDividends`) + CSV fallback seed. Spike Week 3: evaluate NGX X-Data / African Markets / broker feeds; seed top-40 liquid tickers manually if needed.
- Cron (node-cron + BullMQ on Redis): `daily_close` (17:00 WAT), `fundamentals_refresh` weekly, `news_poll` 4x/day, `sunday_picks` Sun 07:00 WAT.
- Quality gates: >3d missing prices → exclude from picks + cap Confidence at Medium; financials >18mo stale → cap Fundamental.

**Accept:** 40+ tickers, 12mo prices, last FY financials, `Data as of` on every view.

---

## Phase 4 — Scoring + Recommendations (Weeks 4-6, `packages/scoring/`)

TypeScript port of v1 weights (tune later):
Fundamental 25 / Valuation 25 / Growth 15 / Market 10 / Dividend 10 (20 if income objective) / Risk-inverse 15. Confidence from coverage/recency/consistency. Thresholds: BUY ≥75 + valuation-ok + no block; WATCH 65-74; HOLD 50-64 or overvalued-quality; SELL <40 (held/watched only); else NO_STRONG_OPPORTUNITY.

Persist `why[3], key_risk, why_now, contradictory_evidence, what_would_change, inputs_snapshot, engine_version`. 200+ Vitest cases incl. good-co-expensive→HOLD, cheap-improving→BUY, thin-data→Medium-cap.

---

## Phase 5 — Suitability + Portfolio (Weeks 6-7)

Suitability matrix v1 (Conservative+volatile→Low, Short+illiquid→Low, Income+no-yield→Low, etc.) → `High/Med/Low + reason`. Unsuitable-but-attractive → `Outside Your Profile` shelf.

Portfolio: holdings CRUD, value/P&L/weights, sector alloc, concentration >25% flag, div yield, `portfolio_impact` (“Financials 18%→24%”), 2 diversification suggestions. Property-test weights sum 100%.

---

## Phase 6 — Web + Mobile Build (Weeks 7-10)

**Web (Next.js):** App Router groups `(marketing)`, `(app)/dashboard, /discover, /stocks/[ticker], /compare, /portfolio, /watchlist, /picks, /alerts, /settings`. Server Components for detail/thesis (SEO + speed), Client Components for interactive cards. `NEXT_PUBLIC_API_URL` + Paystack inline popups. Strict TS (`"strict": true, noUncheckedIndexedAccess`), ESLint + `tsc --noEmit` in CI.

**Mobile (Expo):** Expo Router `(tabs): index(discover), portfolio, watchlist, alerts, settings` + `stocks/[ticker]`. React Query against same `/api/v1`. Offline: cache last portfolio/watchlist with `async-storage`; banner if API unreachable (common on local host). EAS Build for internal distribution (no store yet).

Search v1: keyword + filters (sector/category/objective chips). Full NLQ deferred.

---

## Phase 7 — Weekly Picks, Alerts, Comms (Weeks 10-11)

Worker `sunday_picks`: rank by `score × suitability` → write `weekly_picks(market + personal)` (personal may be null → “No strong opportunity”). Notify: insert `alerts` (in-app) + ZeptoMail send + Expo Push (best-effort; requires tunnel/uptime). Rec-change detector (`WATCH→BUY` etc.) with `reason_for_change`; notify holders/watchers only. User toggles: rec-change, score ±5, price ±7%, earnings, dividends, material news.

Copy per PRD §18 with deep links (`aido://picks/...` mobile, `/picks/...` web).

---

## Phase 8 — Trust, Paystack, Hardening (Weeks 11-12)

- Trust: methodology page, Data vs Analysis vs Recommendation labels, rec history, disclaimer “Educational intelligence, not financial advice” + SEC Nigeria legal review.
- Paystack: Free (market info, limited analysis, basic portfolio/watchlist, market pick) vs Premium (full thesis, personal picks, advanced alerts/compare/history). `packages/payments/paystack.ts` (initialize, verify, webhook `charge.success` → set `subscriptions`). Test with Paystack test keys; webhooks via tunnel in dev.
- Security: Better Auth rate-limit + CSRF, Zod on all inputs, R2 presigned TTL 15min, secrets in `.env` (never commit), `audit_logs` for rec/subscription changes.
- QA: Playwright (web E2E) + Maestro/Detox smoke (mobile) + Vitest (scoring). Chaos tests: stale-data, no-pick week, suspended ticker, laptop-asleep retry.

---

## Phase 9 — Beta on Local Infra (Weeks 12-13)

30-50 testers on LAN/tunnel + EAS internal + web URL. North Star (PRD §41): % actives using Aido weekly for decisions. Track WAU, portfolio-connected %, pick CTR, watchlist engagement, D7/D30, premium intent. Publish backup/restore runbook, data-delay status banner, rollback = redeploy prior Docker tag + `engine_v1.json` version pin.

**Phase 1.5 (after validation):** add Termii (NG-first, cheaper local SMS) + Twilio fallback + WhatsApp Cloud templates for pick reminders / dividend alerts. Keep provider abstraction in `packages/notify/`.

## Risks
1. NGX data licensing/cost — spike early, CSV seed fallback.
2. Local hosting reliability (sleep/power/NAT) — mitigations above; move to managed host before public launch.
3. Advice regulation — education framing + counsel review.
4. Scope creep — freeze post-MVP list (PRD §37).

## Next actions
- [ ] Approve this v2 stack + monorepo layout
- [ ] `pnpm init` Turborepo + `infra/docker-compose.yml` (Postgres+Redis+Caddy) + Drizzle bootstrap
- [ ] Better Auth + R2 + ZeptoMail env wiring (`.env.example`)
- [ ] 40-ticker seed + adapter spike
- [ ] DS tokens + shadcn theme + Expo NativeWind mirror
- [ ] `score_v1.ts` + 10 fixtures TDD
