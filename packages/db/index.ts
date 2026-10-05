import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://aido:aido@localhost:5432/aido";
// Cloud Postgres (Neon) needs TLS; local Docker does not. Set DATABASE_SSL=require
// in cloud environments (e.g. Netlify) and leave it unset locally.
const ssl = process.env.DATABASE_SSL === "require" ? "require" : undefined;
const client = postgres(url, { max: 5, ssl });
export const db = drizzle(client, { schema });
export * from "./schema";
