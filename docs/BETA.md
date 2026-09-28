# Aido Beta Guide (Phase 9)

Goal: 30-50 real NGX investors using the app weekly. North Star (PRD S41):
**% of active investors who use Aido weekly to make or review decisions.**

## 1. Start everything (your PC)

```powershell
cd C:\Users\USER\Documents\Aido
docker compose -f infra/docker-compose.yml up -d postgres redis
pnpm install
pnpm --filter @aido/db migrate
pnpm --filter @aido/web dev
```

Open http://localhost:3000. Health: `powershell -File infra/smoke.ps1`.

## 2. Invite a tester on your Wi-Fi

1. Find your PC address: `ipconfig` (look for IPv4, e.g. 192.168.1.10).
2. Tester opens `http://192.168.1.10:3000` on their phone browser.
3. They sign up at `/signup`, search a stock they own, tap + Watch.

For the Expo app: tester installs **Expo Go**, you run
`EXPO_PUBLIC_API_URL=http://192.168.1.10:3000/api/v1 pnpm --filter @aido/mobile start`
and they scan your QR code.

## 3. What to ask testers (5 questions)

1. What looks interesting this week, and why?
2. Is the pick suitable for you? Did Outside Profile make sense?
3. Does it fit your portfolio? Was the impact line clear?
4. What could go wrong — did Aido warn you enough?
5. What changed since last week — did you get it fast?

Track weekly: testers active, portfolios connected, pick clicks,
watchlist adds, return visits, Premium interest.

## 4. Sunday routine

```powershell
$env:DATABASE_URL = "postgres://aido:aido@localhost:5432/aido"
pnpm --filter @aido/worker score    # refresh ratings
pnpm --filter @aido/worker weekly   # market + personal picks, alerts
powershell -File infra/backup.ps1   # back up first, always
```

## 5. If something breaks (rollback)

- App bug: `git log --oneline`, then `git revert <bad-commit>`, rebuild, smoke test.
- Bad data: restore last backup into a temp DB first, confirm, then swap.
- Scoring bug: ratings are versioned (`engine_version`) — old ratings stay untouched
  until you re-run the scorer.

## 6. Before public launch (not yet)

- Real NGX feed replaces `seed-sample` data (Phase 3.5 adapter ready).
- Paystack live keys + webhook URL; Google/Apple login keys.
- Legal review (SEC Nigeria) + "not financial advice" review.
- Managed hosting instead of this PC.
