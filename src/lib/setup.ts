import "server-only";
import { cache } from "react";
import { databaseUrl } from "./database-url.mjs";
import { prisma as db } from "./prisma-client";
import { SCHEMA_SQL } from "./schema-sql";
import { loadStarterData } from "./starter-data";

// Arbitrary key so concurrent first requests don't both create tables or load the catalog.
const SETUP_LOCK = 727_274;

type Client = Pick<typeof db, "$queryRaw">;

// Reads pg_class directly rather than to_regclass(), whose cached lookup can miss a
// table another server created a moment ago.
async function tablesExist(client: Client = db) {
  const [{ exists }] = await client.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'Setting'
    ) AS exists`;
  return exists;
}

/** Creates the tables and loads the starter catalog the first time the store runs. */
async function initialize() {
  if ((await tablesExist()) && (await db.setting.count()) > 0) return;
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SETUP_LOCK})`;
      if (!(await tablesExist(tx))) for (const statement of SCHEMA_SQL) await tx.$executeRawUnsafe(statement);
      if ((await tx.setting.count()) === 0) await loadStarterData(tx, { demo: false });
    },
    { timeout: 60_000, maxWait: 30_000 }
  );
}

let ready: Promise<void> | null = null;

/** Runs first-time setup once per server instance; retried on the next call if it fails. */
export function ensureDatabase() {
  ready ??= initialize().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

export type SetupStatus = { ok: true } | { ok: false; reason: "no-database" | "unreachable" };

/** Checks the database once per server instance (and once per request via React cache). */
export const getSetupStatus = cache(async (): Promise<SetupStatus> => {
  if (!databaseUrl()) return { ok: false, reason: "no-database" };
  try {
    await ensureDatabase();
    return { ok: true };
  } catch (e) {
    console.error("Database setup failed:", e);
    return { ok: false, reason: "unreachable" };
  }
});
