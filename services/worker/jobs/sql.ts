// Run a .sql file against DATABASE_URL. Usage: pnpm --filter @aido/worker sql <file>
import { readFileSync } from "node:fs";
import postgres from "postgres";

async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: sql <file>");
  const url = process.env.DATABASE_URL ?? "postgres://aido:aido@localhost:5432/aido";
  const ssl = process.env.DATABASE_SSL === "require" ? "require" : undefined;
  const sql = postgres(url, { ssl, max: 1 });
  const statements = readFileSync(file, "utf8")
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    const rows = (await sql.unsafe(stmt)) as Record<string, unknown>[];
    if (Array.isArray(rows)) console.log(JSON.stringify(rows));
    else console.log("[sql] ok");
  }
  await sql.end();
  console.log(`[sql] applied ${file}`);
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
