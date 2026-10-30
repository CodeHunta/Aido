// Single drizzle-orm instance for the whole monorepo.
// Import SQL operators from here (never "drizzle-orm" directly outside @aido/db)
// so table types always match the operator types — avoids duplicate-copy errors.
export { and, asc, count, desc, eq, gte, inArray, like, sql } from "drizzle-orm";
