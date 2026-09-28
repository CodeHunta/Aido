export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm font-bold uppercase tracking-widest text-slate-500">Aido</p>
      <h1 className="mt-2 text-4xl font-extrabold tracking-tight">
        Don&apos;t just know what the market is doing. Know what it means for you.
      </h1>
      <p className="mt-4 text-slate-500">
        Mobile-first investment intelligence for Nigerian equities. Phase 2 scaffold is live —
        health check at <code>/api/health</code>.
      </p>
      <div className="mt-6 flex gap-2 text-xs font-bold">
        <span className="rounded-full bg-buy-bg px-3 py-1.5 text-buy-fg">BUY</span>
        <span className="rounded-full bg-hold-bg px-3 py-1.5 text-hold-fg">HOLD</span>
        <span className="rounded-full bg-sell-bg px-3 py-1.5 text-sell-fg">SELL</span>
        <span className="rounded-full bg-watch-bg px-3 py-1.5 text-watch-fg">WATCH</span>
      </div>
    </main>
  );
}
