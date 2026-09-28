// Single drizzle-orm instance for the whole monorepo.
// Import SQL operators from here (never "drizzle-orm" directly outside @aido/db)
// so table types always match the operator types — avoids duplicate-copy errors.
export { and, desc, eq, like } from "drizzle-orm";
