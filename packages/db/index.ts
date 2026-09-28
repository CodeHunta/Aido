import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://aido:aido@localhost:5432/aido";
const client = postgres(url, { max: 5 });
export const db = drizzle(client, { schema });
export * from "./schema";
